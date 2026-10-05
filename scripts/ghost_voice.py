import json
import os
import queue
import sys
import threading
from pathlib import Path

import numpy as np

SAMPLE_RATE = 16_000
FRAME_SECONDS = 0.25
SILENCE_SECONDS = 0.75
MAX_UTTERANCE_SECONDS = 12
VOICE_THRESHOLD = 260
MAX_AUDIO_FRAMES = int(6 / FRAME_SECONDS)


def emit(message: dict[str, object]) -> None:
    print(json.dumps(message, ensure_ascii=True), flush=True)


def main() -> int:
    try:
        import sounddevice as sd
        from faster_whisper import WhisperModel

        bundle_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
        model_path = bundle_root / "model"
        if not (model_path / "model.bin").is_file():
            raise FileNotFoundError(f"The bundled multilingual speech model is missing: {model_path}")

        model = WhisperModel(
            str(model_path),
            device="cpu",
            compute_type="int8",
            cpu_threads=max(2, min(4, os.cpu_count() or 2)),
            num_workers=1,
        )
        audio_queue: queue.Queue[bytes] = queue.Queue(maxsize=MAX_AUDIO_FRAMES)
        transcription_queue: queue.Queue[tuple[list[np.ndarray], int] | None] = queue.Queue(maxsize=1)
        command_queue: queue.Queue[str] = queue.Queue()
        paused = threading.Event()
        stopping = threading.Event()
        output_lock = threading.Lock()
        transcription_epoch = [0]

        def emit_threadsafe(message: dict[str, object]) -> None:
            with output_lock:
                emit(message)

        def on_audio(indata: bytes, _frames: int, _time_info: object, status: object) -> None:
            if status and "input overflow" not in str(status).lower():
                print(f"Microphone input warning: {status}", file=sys.stderr, flush=True)
            if not paused.is_set() and not stopping.is_set():
                try:
                    audio_queue.put_nowait(bytes(indata))
                except queue.Full:
                    try:
                        audio_queue.get_nowait()
                    except queue.Empty:
                        pass
                    try:
                        audio_queue.put_nowait(bytes(indata))
                    except queue.Full:
                        pass

        def read_commands() -> None:
            for line in sys.stdin:
                command_queue.put(line.strip().lower())
            command_queue.put("stop")

        def transcribe_queued_audio() -> None:
            while not stopping.is_set():
                try:
                    item = transcription_queue.get(timeout=0.1)
                except queue.Empty:
                    continue
                if item is None:
                    return
                frames, epoch = item
                if paused.is_set() or epoch != transcription_epoch[0]:
                    continue
                try:
                    audio = np.concatenate(frames).astype(np.float32) / 32768.0
                    segments, info = model.transcribe(
                        audio,
                        beam_size=1,
                        condition_on_previous_text=False,
                        vad_filter=True,
                    )
                    text = " ".join(segment.text.strip() for segment in segments).strip()
                    if text and not paused.is_set() and epoch == transcription_epoch[0]:
                        emit_threadsafe({
                            "type": "transcript",
                            "text": text,
                            "language": info.language,
                        })
                except Exception as error:
                    emit_threadsafe({"type": "error", "message": f"Could not transcribe microphone audio: {error}"})

        threading.Thread(target=read_commands, daemon=True).start()
        threading.Thread(target=transcribe_queued_audio, daemon=True).start()

        try:
            stream = sd.RawInputStream(
                samplerate=SAMPLE_RATE,
                blocksize=int(SAMPLE_RATE * FRAME_SECONDS),
                channels=1,
                dtype="int16",
                callback=on_audio,
            )
            stream.start()
        except Exception as error:
            raise RuntimeError(
                "Could not open the default microphone. Check Windows microphone privacy "
                "access and connect or select a working microphone."
            ) from error

        emit({"type": "ready"})
        speech_frames: list[np.ndarray] = []
        silent_frames = 0
        try:
            while not stopping.is_set():
                try:
                    command = command_queue.get_nowait()
                except queue.Empty:
                    command = ""

                if command == "stop":
                    stopping.set()
                    break
                if command == "pause" and not paused.is_set():
                    paused.set()
                    transcription_epoch[0] += 1
                    speech_frames.clear()
                    silent_frames = 0
                    while not audio_queue.empty():
                        try:
                            audio_queue.get_nowait()
                        except queue.Empty:
                            break
                    while not transcription_queue.empty():
                        try:
                            transcription_queue.get_nowait()
                        except queue.Empty:
                            break
                    emit_threadsafe({"type": "paused"})
                elif command == "resume" and paused.is_set():
                    transcription_epoch[0] += 1
                    speech_frames.clear()
                    silent_frames = 0
                    while not audio_queue.empty():
                        try:
                            audio_queue.get_nowait()
                        except queue.Empty:
                            break
                    paused.clear()
                    emit_threadsafe({"type": "ready"})

                if paused.is_set():
                    stopping.wait(0.05)
                    continue

                try:
                    frame = audio_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                samples = np.frombuffer(frame, dtype=np.int16)
                is_speech = float(np.sqrt(np.mean(samples.astype(np.float32) ** 2))) >= VOICE_THRESHOLD
                if is_speech or speech_frames:
                    speech_frames.append(samples.copy())
                if is_speech:
                    silent_frames = 0
                elif speech_frames:
                    silent_frames += 1

                utterance_full = len(speech_frames) * FRAME_SECONDS >= MAX_UTTERANCE_SECONDS
                utterance_ended = speech_frames and silent_frames * FRAME_SECONDS >= SILENCE_SECONDS
                if utterance_full or utterance_ended:
                    try:
                        transcription_queue.put_nowait((speech_frames.copy(), transcription_epoch[0]))
                    except queue.Full:
                        try:
                            transcription_queue.get_nowait()
                        except queue.Empty:
                            pass
                        try:
                            transcription_queue.put_nowait((speech_frames.copy(), transcription_epoch[0]))
                        except queue.Full:
                            pass
                    speech_frames.clear()
                    silent_frames = 0
        finally:
            stopping.set()
            try:
                transcription_queue.put_nowait(None)
            except queue.Full:
                pass
            stream.stop()
            stream.close()
        return 0
    except Exception as error:
        print(f"Ghost voice listener failed: {error}", file=sys.stderr, flush=True)
        emit({"type": "error", "message": str(error)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
