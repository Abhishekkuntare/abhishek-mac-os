/**
 * Real-time Web Audio Synthesizer & Music Engine for Abhishek OS
 * Provides authentic procedural ambient, synthwave, chillhop, and classical soundscapes,
 * as well as playback for local computer audio files (.mp3, .wav, .m4a, .ogg).
 */

import { AudioTrack } from '../types/desktop';

type ProgressCallback = (currentTime: number, duration: number, percent: number) => void;

class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private currentTrack: AudioTrack | null = null;
  private isPlaying = false;
  private playbackTime = 0; // seconds
  private trackDuration = 180; // seconds
  private intervalId: number | null = null;
  private synthIntervalId: number | null = null;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private trackEndCallbacks: Set<() => void> = new Set();

  // For custom audio file playback (.mp3, .wav, etc.)
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Active oscillators for cleanup
  private activeNodes: (AudioNode & { stop?: (when?: number) => void })[] = [];

  constructor() {
    // Lazy initialized on user interaction
  }

  private initAudio() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
  }

  public onProgress(cb: ProgressCallback): () => void {
    this.progressCallbacks.add(cb);
    return () => this.progressCallbacks.delete(cb);
  }

  public onTrackEnd(cb: () => void): () => void {
    this.trackEndCallbacks.add(cb);
    return () => this.trackEndCallbacks.delete(cb);
  }

  private emitProgress() {
    const pct = this.trackDuration > 0 ? (this.playbackTime / this.trackDuration) * 100 : 0;
    this.progressCallbacks.forEach(cb => cb(this.playbackTime, this.trackDuration, pct));
  }

  public getVisualizerData(): number[] {
    if (!this.analyser || !this.isPlaying) {
      return Array.from({ length: 24 }, () => 4);
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Map 32 bins to 24 bars scaled between 4 and 32
    const bars: number[] = [];
    for (let i = 0; i < 24; i++) {
      const binIdx = Math.floor((i / 24) * bufferLength);
      const val = dataArray[binIdx] || 0;
      bars.push(Math.max(4, Math.round((val / 255) * 32)));
    }
    return bars;
  }

  public playTrack(track: AudioTrack, startFromPercent = 0) {
    this.initAudio();
    this.stopCurrent();

    this.currentTrack = track;
    this.trackDuration = track.duration || 180;
    this.playbackTime = (startFromPercent / 100) * this.trackDuration;
    this.isPlaying = true;

    // Check if custom audio file URL is available
    const customUrl = (track as { audioUrl?: string }).audioUrl;
    if (customUrl) {
      this.playCustomAudioFile(customUrl);
    } else {
      this.playSynthesizerScore(track.synthesizerPreset || 'ambient');
    }

    // Start progress timer
    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.playbackTime += 1;
      if (this.playbackTime >= this.trackDuration) {
        this.playbackTime = 0;
        this.emitProgress();
        this.trackEndCallbacks.forEach(cb => cb());
      } else {
        this.emitProgress();
      }
    }, 1000);

    this.emitProgress();
  }

  private playCustomAudioFile(url: string) {
    if (!this.ctx || !this.masterGain) return;
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.masterGain);
      }

      this.audioElement.src = url;
      this.audioElement.currentTime = this.playbackTime;
      this.audioElement.play().catch(err => {
        console.warn('Audio playback error, falling back to synthesizer', err);
        this.playSynthesizerScore('ambient');
      });

      this.audioElement.onloadedmetadata = () => {
        if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
          this.trackDuration = Math.round(this.audioElement.duration);
        }
      };

      this.audioElement.onended = () => {
        this.trackEndCallbacks.forEach(cb => cb());
      };
    } catch (e) {
      console.warn('Error setting up audio element', e);
      this.playSynthesizerScore('ambient');
    }
  }

  /**
   * Procedural Audio Synthesizer Engine
   * Generates pleasing melodic compositions client-side
   */
  private playSynthesizerScore(preset: AudioTrack['synthesizerPreset']) {
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const dest = this.masterGain;

    // Create a shared warm reverb filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset === 'synthwave' ? 2200 : 1200, ctx.currentTime);
    filter.connect(dest);

    let step = 0;

    // Scale notes in Hz
    const ambientChords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G
    ];

    const synthwaveBass = [110.0, 110.0, 130.81, 146.83, 164.81, 146.83, 130.81, 110.0]; // A minor bass arp
    const chillhopChords = [
      [146.83, 220.0, 261.63, 329.63, 370.0], // Dm9
      [196.0, 246.94, 293.66, 370.0, 440.0], // G13
      [130.81, 196.0, 246.94, 329.63, 392.0], // Cmaj9
      [220.0, 277.18, 329.63, 392.0, 440.0], // A7
    ];

    const classicalArp = [
      261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 659.25, 523.25, 220.0, 261.63, 329.63,
      440.0, 523.25, 440.0, 329.63, 261.63,
    ];

    const tempoMs = preset === 'synthwave' ? 250 : preset === 'chillhop' ? 500 : 800;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      if (preset === 'ambient') {
        const chordIdx = Math.floor(step / 4) % ambientChords.length;
        const chord = ambientChords[chordIdx];

        // Pad voice
        if (step % 4 === 0) {
          chord.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

            osc.connect(gain);
            gain.connect(filter);
            osc.start(now);
            osc.stop(now + 3.4);
            this.activeNodes.push(osc, gain);
          });
        }

        // Arpeggio note
        const noteFreq = chord[step % chord.length] * 2;
        const arpOsc = ctx.createOscillator();
        const arpGain = ctx.createGain();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(noteFreq, now);

        arpGain.gain.setValueAtTime(0.001, now);
        arpGain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        arpOsc.connect(arpGain);
        arpGain.connect(filter);
        arpOsc.start(now);
        arpOsc.stop(now + 1.0);
        this.activeNodes.push(arpOsc, arpGain);
      } else if (preset === 'synthwave') {
        // Punchy synth bass
        const bassFreq = synthwaveBass[step % synthwaveBass.length];
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.08, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        bassOsc.connect(bassGain);
        bassGain.connect(filter);
        bassOsc.start(now);
        bassOsc.stop(now + 0.24);
        this.activeNodes.push(bassOsc, bassGain);

        // Synth kick on 1 & 5
        if (step % 4 === 0) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

          kickGain.gain.setValueAtTime(0.18, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          kickOsc.connect(kickGain);
          kickGain.connect(dest);
          kickOsc.start(now);
          kickOsc.stop(now + 0.2);
          this.activeNodes.push(kickOsc, kickGain);
        }
      } else if (preset === 'chillhop') {
        const chordIdx = Math.floor(step / 4) % chillhopChords.length;
        const chord = chillhopChords[chordIdx];

        if (step % 2 === 0) {
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.02);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.02 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 1.2);

            osc.connect(gain);
            gain.connect(filter);
            osc.start(now + idx * 0.02);
            osc.stop(now + idx * 0.02 + 1.3);
            this.activeNodes.push(osc, gain);
          });
        }
      } else {
        // Classical piano bells
        const note = classicalArp[step % classicalArp.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 1.5);
        this.activeNodes.push(osc, gain);
      }

      step++;
    };

    // Trigger immediately and interval
    playStep();
    this.synthIntervalId = window.setInterval(playStep, tempoMs);
  }

  public pause() {
    this.isPlaying = false;
    this.stopCurrent();
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resume() {
    if (this.currentTrack) {
      this.isPlaying = true;
      const customUrl = (this.currentTrack as { audioUrl?: string }).audioUrl;
      if (customUrl && this.audioElement) {
        this.audioElement.play().catch(() => {});
      } else if (this.currentTrack.synthesizerPreset) {
        this.playSynthesizerScore(this.currentTrack.synthesizerPreset);
      }

      this.intervalId = window.setInterval(() => {
        if (!this.isPlaying) return;
        this.playbackTime += 1;
        if (this.playbackTime >= this.trackDuration) {
          this.playbackTime = 0;
          this.emitProgress();
          this.trackEndCallbacks.forEach(cb => cb());
        } else {
          this.emitProgress();
        }
      }, 1000);
    }
  }

  public seek(percent: number) {
    const clampedPct = Math.max(0, Math.min(100, percent));
    this.playbackTime = (clampedPct / 100) * this.trackDuration;
    if (this.audioElement) {
      this.audioElement.currentTime = this.playbackTime;
    }
    this.emitProgress();
  }

  public stopCurrent() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }
}

export const musicEngine = new MusicEngine();
