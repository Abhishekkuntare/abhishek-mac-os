import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Trophy } from 'lucide-react';

type Rect = { x: number; y: number; width: number; height: number };
type Level = {
  name: string;
  sky: string;
  glow: string;
  length: number;
  platforms: Rect[];
  hazards: Rect[];
  coins: Array<[number, number]>;
  checkpoints: number[];
  exit: number;
};

const levels: Level[] = [
  {
    name: 'Tutorial: First Light', sky: '#151c4a', glow: '#35d8cf', length: 2100,
    platforms: [{ x: 0, y: 438, width: 490, height: 100 }, { x: 570, y: 438, width: 300, height: 100 }, { x: 970, y: 438, width: 360, height: 100 }, { x: 1430, y: 438, width: 670, height: 100 }, { x: 320, y: 350, width: 110, height: 20 }, { x: 710, y: 345, width: 120, height: 20 }, { x: 1110, y: 350, width: 110, height: 20 }, { x: 1580, y: 340, width: 160, height: 20 }],
    hazards: [{ x: 650, y: 416, width: 58, height: 22 }, { x: 1150, y: 416, width: 60, height: 22 }],
    coins: [[365, 315], [750, 310], [1160, 315], [1630, 300], [1840, 395]], checkpoints: [1040], exit: 1980,
  },
  {
    name: 'Neon City', sky: '#30164d', glow: '#ff53c8', length: 2300,
    platforms: [{ x: 0, y: 438, width: 360, height: 100 }, { x: 460, y: 380, width: 190, height: 20 }, { x: 735, y: 330, width: 180, height: 20 }, { x: 1000, y: 390, width: 210, height: 20 }, { x: 1280, y: 438, width: 300, height: 100 }, { x: 1680, y: 360, width: 190, height: 20 }, { x: 1950, y: 438, width: 350, height: 100 }],
    hazards: [{ x: 530, y: 358, width: 48, height: 22 }, { x: 1060, y: 368, width: 62, height: 22 }, { x: 1390, y: 416, width: 70, height: 22 }, { x: 1745, y: 338, width: 48, height: 22 }],
    coins: [[510, 340], [800, 290], [1085, 350], [1440, 395], [1740, 320], [2100, 395]], checkpoints: [1280, 1950], exit: 2200,
  },
  {
    name: 'Cyber Factory', sky: '#132e3b', glow: '#ffc247', length: 2400,
    platforms: [{ x: 0, y: 438, width: 420, height: 100 }, { x: 510, y: 395, width: 150, height: 20 }, { x: 735, y: 350, width: 150, height: 20 }, { x: 970, y: 305, width: 170, height: 20 }, { x: 1225, y: 390, width: 190, height: 20 }, { x: 1500, y: 438, width: 360, height: 100 }, { x: 1940, y: 350, width: 180, height: 20 }, { x: 2180, y: 438, width: 220, height: 100 }],
    hazards: [{ x: 545, y: 373, width: 52, height: 22 }, { x: 1015, y: 283, width: 48, height: 22 }, { x: 1300, y: 368, width: 64, height: 22 }, { x: 1620, y: 416, width: 80, height: 22 }, { x: 1995, y: 328, width: 55, height: 22 }],
    coins: [[570, 355], [790, 310], [1040, 265], [1310, 350], [1630, 395], [2000, 310], [2260, 395]], checkpoints: [1225, 1940], exit: 2310,
  },
  {
    name: 'Void Dimension', sky: '#17152f', glow: '#9e83ff', length: 2500,
    platforms: [{ x: 0, y: 438, width: 300, height: 100 }, { x: 380, y: 365, width: 135, height: 20 }, { x: 595, y: 310, width: 135, height: 20 }, { x: 810, y: 365, width: 135, height: 20 }, { x: 1030, y: 438, width: 240, height: 100 }, { x: 1360, y: 330, width: 150, height: 20 }, { x: 1590, y: 275, width: 150, height: 20 }, { x: 1820, y: 345, width: 145, height: 20 }, { x: 2050, y: 438, width: 450, height: 100 }],
    hazards: [{ x: 415, y: 343, width: 45, height: 22 }, { x: 645, y: 288, width: 48, height: 22 }, { x: 1090, y: 416, width: 65, height: 22 }, { x: 1400, y: 308, width: 50, height: 22 }, { x: 1635, y: 253, width: 50, height: 22 }, { x: 1860, y: 323, width: 52, height: 22 }],
    coins: [[420, 325], [630, 270], [850, 325], [1110, 395], [1410, 290], [1640, 235], [1870, 305], [2240, 395]], checkpoints: [1030, 2050], exit: 2410,
  },
  {
    name: 'Final Challenge', sky: '#321b48', glow: '#ff6b70', length: 2650,
    platforms: [{ x: 0, y: 438, width: 290, height: 100 }, { x: 370, y: 355, width: 120, height: 20 }, { x: 560, y: 300, width: 120, height: 20 }, { x: 755, y: 355, width: 120, height: 20 }, { x: 950, y: 410, width: 130, height: 20 }, { x: 1160, y: 438, width: 270, height: 100 }, { x: 1500, y: 365, width: 135, height: 20 }, { x: 1710, y: 305, width: 135, height: 20 }, { x: 1920, y: 360, width: 135, height: 20 }, { x: 2130, y: 438, width: 520, height: 100 }],
    hazards: [{ x: 395, y: 333, width: 50, height: 22 }, { x: 585, y: 278, width: 52, height: 22 }, { x: 780, y: 333, width: 48, height: 22 }, { x: 985, y: 388, width: 58, height: 22 }, { x: 1220, y: 416, width: 75, height: 22 }, { x: 1535, y: 343, width: 50, height: 22 }, { x: 1745, y: 283, width: 55, height: 22 }, { x: 1955, y: 338, width: 58, height: 22 }],
    coins: [[405, 315], [600, 260], [795, 315], [990, 370], [1250, 395], [1540, 320], [1750, 260], [1970, 315], [2300, 395]], checkpoints: [1160, 2130], exit: 2570,
  },
];

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && a.x + a.width > b.x &&
  a.y < b.y + b.height && a.y + a.height > b.y;

export const PixelDashGame: React.FC<{ restartKey: number }> = ({ restartKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const keysRef = useRef(new Set<string>());
  const [paused, setPaused] = useState(true);
  const [rendererError, setRendererError] = useState<string | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [coins, setCoins] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);
  const [recordImproved, setRecordImproved] = useState(false);
  const [bestTime, setBestTime] = useState(() => {
    try { return Number(localStorage.getItem('abhishek-arcade-pixel-dash-best')) || 0; } catch { return 0; }
  });
  const [completedLevels, setCompletedLevels] = useState(() => {
    try { return Number(localStorage.getItem('abhishek-arcade-pixel-dash-levels')) || 0; } catch { return 0; }
  });
  const [soundOn, setSoundOn] = useState(true);
  const stateRef = useRef({
    x: 55, y: 390, vx: 0, vy: 0, grounded: false, checkpoint: 55,
    collected: new Set<string>(), time: 0, level: 0, coins: 0, deaths: 0,
    paused: true, complete: false, lastFrame: 0, lastHud: 0, soundOn: true,
  });

  const reset = useCallback((keepProgress = false) => {
    const state = stateRef.current;
    state.level = 0;
    state.x = 55;
    state.y = 390;
    state.vx = 0;
    state.vy = 0;
    state.grounded = false;
    state.checkpoint = 55;
    state.collected.clear();
    state.time = 0;
    state.deaths = 0;
    state.complete = false;
    state.paused = true;
    if (!keepProgress) state.coins = 0;
    setLevelIndex(0);
    setCoins(state.coins);
    setDeaths(0);
    setElapsed(0);
    setComplete(false);
    setRecordImproved(false);
    setPaused(true);
  }, []);

  useEffect(() => { reset(); }, [restartKey, reset]);
  useEffect(() => { stateRef.current.soundOn = soundOn; }, [soundOn]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      setRendererError('Pixel Dash cannot start because this window does not provide a 2D canvas renderer.');
      return;
    }
    setRendererError(null);

    const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      if (!stateRef.current.soundOn) return;
      const AudioContextType = window.AudioContext;
      if (!AudioContextType) return;
      const audio = new AudioContextType();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(0.055, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
      oscillator.onended = () => { void audio.close(); };
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!canvas.getClientRects().length) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
      keysRef.current.add(event.code);
      const game = stateRef.current;
      if (event.code === 'Escape' || event.code === 'KeyP') {
        game.paused = !game.paused;
        setPaused(game.paused);
      } else if (event.code === 'KeyR') reset();
      else if (event.code === 'Space' && game.paused && !game.complete) {
        game.paused = false;
        setPaused(false);
      } else if (event.code === 'Space' && game.grounded && !game.paused && !game.complete) {
        game.vy = -590;
        game.grounded = false;
        playTone(520, 0.08, 'triangle');
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onBlur = () => keysRef.current.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const draw = (timestamp: number) => {
      frameRef.current = requestAnimationFrame(draw);
      const game = stateRef.current;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(rect.width / 960, rect.height / 500);
      const width = rect.width / scale;
      const height = rect.height / scale;
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
      }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);

      const level = levels[game.level];
      const dt = game.lastFrame ? Math.min((timestamp - game.lastFrame) / 1000, 0.032) : 0;
      game.lastFrame = timestamp;
      const camera = Math.max(0, Math.min(level.length - width, game.x - width * 0.32));

      if (!game.paused && !game.complete && dt > 0) {
        game.time += dt;
        const left = keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA');
        const right = keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD');
        const acceleration = 1450;
        if (left !== right) game.vx += (right ? acceleration : -acceleration) * dt;
        else game.vx *= Math.pow(0.001, dt);
        game.vx = Math.max(-260, Math.min(260, game.vx));

        const previous = { x: game.x, y: game.y, bottom: game.y + 38 };
        game.x = Math.max(0, Math.min(level.length - 32, game.x + game.vx * dt));
        const player: Rect = { x: game.x, y: game.y, width: 30, height: 38 };
        for (const platform of level.platforms) {
          if (overlaps(player, platform)) {
            if (game.vx > 0 && previous.x + 30 <= platform.x + 8) game.x = platform.x - 30;
            else if (game.vx < 0 && previous.x >= platform.x + platform.width - 8) game.x = platform.x + platform.width;
            game.vx = 0;
            player.x = game.x;
          }
        }

        game.vy = Math.min(900, game.vy + 1650 * dt);
        game.y += game.vy * dt;
        game.grounded = false;
        player.y = game.y;
        for (const platform of level.platforms) {
          if (game.vy >= 0 && previous.bottom <= platform.y + 8 && game.y + 38 >= platform.y &&
            player.x + player.width > platform.x && player.x < platform.x + platform.width) {
            game.y = platform.y - 38;
            game.vy = 0;
            game.grounded = true;
            player.y = game.y;
          } else if (game.vy < 0 && overlaps(player, platform)) {
            game.y = platform.y + platform.height;
            game.vy = 0;
          }
        }

        if (game.y > height + 80 || level.hazards.some(hazard => overlaps(player, hazard))) {
          game.x = game.checkpoint;
          game.y = 390;
          game.vx = 0;
          game.vy = 0;
          game.deaths += 1;
          setDeaths(game.deaths);
          playTone(130, 0.18, 'sawtooth');
        }

        level.coins.forEach(([x, y], index) => {
          const id = `${game.level}:${index}`;
          if (!game.collected.has(id) && overlaps(player, { x: x - 11, y: y - 11, width: 22, height: 22 })) {
            game.collected.add(id);
            game.coins += 1;
            setCoins(game.coins);
            playTone(880, 0.09, 'triangle');
          }
        });
        level.checkpoints.forEach(checkpoint => {
          if (game.x >= checkpoint && game.checkpoint < checkpoint) game.checkpoint = checkpoint;
        });

        if (game.x + 30 >= level.exit) {
          if (game.level === levels.length - 1) {
            game.complete = true;
            setComplete(true);
            game.paused = true;
            setPaused(true);
            const seconds = Math.floor(game.time);
            if (!bestTime || seconds < bestTime) {
              setBestTime(seconds);
              setRecordImproved(true);
              try { localStorage.setItem('abhishek-arcade-pixel-dash-best', String(seconds)); } catch { /* Storage may be unavailable. */ }
            }
            const finishedLevels = Math.max(completedLevels, levels.length);
            setCompletedLevels(finishedLevels);
            try { localStorage.setItem('abhishek-arcade-pixel-dash-levels', String(finishedLevels)); } catch { /* Storage may be unavailable. */ }
            playTone(740, 0.35, 'triangle');
          } else {
            game.level += 1;
            game.x = 55;
            game.y = 390;
            game.checkpoint = 55;
            game.vx = 0;
            game.vy = 0;
            setLevelIndex(game.level);
            const finishedLevels = Math.max(completedLevels, game.level);
            setCompletedLevels(finishedLevels);
            try { localStorage.setItem('abhishek-arcade-pixel-dash-levels', String(finishedLevels)); } catch { /* Storage may be unavailable. */ }
          }
        }
        if (timestamp - game.lastHud > 150) {
          game.lastHud = timestamp;
          setElapsed(game.time);
        }
      }

      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, level.sky);
      gradient.addColorStop(1, '#101223');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.fillStyle = `${level.glow}22`;
      context.beginPath();
      context.arc(width * 0.78, height * 0.12, height * 0.42, 0, Math.PI * 2);
      context.fill();

      for (let i = 0; i < 48; i += 1) {
        const sx = (i * 137 - camera * 0.18) % (width + 100);
        const sy = (i * 71) % (height * 0.72);
        context.fillStyle = `rgba(255,255,255,${0.2 + (i % 4) * 0.12})`;
        context.fillRect(sx < 0 ? sx + width + 100 : sx, sy, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
      }

      context.save();
      context.translate(-camera, 0);
      for (const platform of level.platforms) {
        const ground = platform.height > 40;
        context.fillStyle = ground ? '#17243c' : '#263252';
        context.fillRect(platform.x, platform.y, platform.width, platform.height);
        context.fillStyle = level.glow;
        context.shadowColor = level.glow;
        context.shadowBlur = 12;
        context.fillRect(platform.x, platform.y, platform.width, 3);
        context.shadowBlur = 0;
      }
      level.hazards.forEach(hazard => {
        context.fillStyle = '#ff5577';
        context.shadowColor = '#ff5577';
        context.shadowBlur = 14;
        context.beginPath();
        context.moveTo(hazard.x, hazard.y + hazard.height);
        context.lineTo(hazard.x + hazard.width / 2, hazard.y);
        context.lineTo(hazard.x + hazard.width, hazard.y + hazard.height);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
      });
      level.coins.forEach(([x, y], index) => {
        if (game.collected.has(`${game.level}:${index}`)) return;
        context.fillStyle = '#ffe07a';
        context.shadowColor = '#ffe07a';
        context.shadowBlur = 15;
        context.beginPath();
        context.arc(x, y, 9, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });
      level.checkpoints.forEach(checkpoint => {
        context.fillStyle = checkpoint <= game.checkpoint ? '#6cf7bd' : '#9c85ff';
        context.fillRect(checkpoint, 382, 5, 56);
        context.fillRect(checkpoint, 382, 26, 17);
      });
      context.fillStyle = '#bca4ff';
      context.shadowColor = '#bca4ff';
      context.shadowBlur = 20;
      context.strokeStyle = '#dfd1ff';
      context.lineWidth = 4;
      context.beginPath();
      context.ellipse(level.exit, 398, 20, 36, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.shadowBlur = 0;

      const playerX = game.x;
      const playerY = game.y;
      context.fillStyle = '#66f5e4';
      context.shadowColor = '#66f5e4';
      context.shadowBlur = 18;
      context.beginPath();
      context.roundRect(playerX, playerY, 30, 38, 8);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = '#122037';
      context.fillRect(playerX + 17, playerY + 10, 5, 5);
      context.restore();

      context.fillStyle = 'rgba(5,8,20,0.6)';
      context.fillRect(14, 14, 290, 55);
      context.fillStyle = '#ffffff';
      context.font = '700 14px system-ui, sans-serif';
      context.fillText(`WORLD ${game.level + 1}  ·  ${level.name}`, 28, 37);
      context.fillStyle = '#c4d0eb';
      context.font = '12px system-ui, sans-serif';
      context.fillText(`CRYSTALS ${game.coins}     FALLS ${game.deaths}     ${game.time.toFixed(1)}s`, 28, 57);

      if (game.paused || game.complete) {
        context.fillStyle = 'rgba(3,6,19,0.72)';
        context.fillRect(0, 0, width, height);
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        context.font = '800 30px system-ui, sans-serif';
        context.fillText(game.complete ? 'ALL WORLDS CLEARED' : game.time > 0 ? 'PAUSED' : 'PIXEL DASH', width / 2, height / 2 - 15);
        context.fillStyle = '#c4d0eb';
        context.font = '14px system-ui, sans-serif';
        context.fillText(game.complete ? `Crystals ${game.coins}  ·  Time ${game.time.toFixed(1)}s` : 'Move: A / D or ← / →     Jump: Space', width / 2, height / 2 + 15);
        context.textAlign = 'start';
      }
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [bestTime, completedLevels, reset]);

  const togglePause = () => {
    const next = !stateRef.current.paused;
    if (stateRef.current.complete) return;
    stateRef.current.paused = next;
    setPaused(next);
  };

  return (
    <section className="mx-auto max-w-4xl rounded-[28px] border border-orange-200/15 bg-gradient-to-b from-[#231a36] to-[#111629] p-4 shadow-2xl sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-widest text-orange-200/55">World {levelIndex + 1} of 5 · {levels[levelIndex].name}</p><p className="mt-1 text-sm font-bold">Crystals {coins} · Falls {deaths} · {elapsed.toFixed(1)}s</p></div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300">Best {bestTime ? `${bestTime}s` : '—'} · Cleared {completedLevels}/5</span>
          <button type="button" onClick={() => setSoundOn(on => !on)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300">{soundOn ? 'Sound on' : 'Sound off'}</button>
          <button type="button" onClick={togglePause} disabled={complete} className="rounded-lg border border-orange-200/15 bg-orange-300/10 p-2 text-orange-100 disabled:opacity-40" aria-label={paused ? 'Resume game' : 'Pause game'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
          <button type="button" onClick={() => reset()} className="rounded-lg border border-white/10 p-2 text-slate-300" aria-label="Restart game"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          onPointerDown={event => {
            event.currentTarget.focus();
            const game = stateRef.current;
            if (game.paused && !game.complete) { game.paused = false; setPaused(false); return; }
            if (game.grounded && !game.paused) { game.vy = -590; game.grounded = false; }
          }}
          className="block h-[min(55vh,460px)] min-h-[260px] w-full touch-none rounded-2xl border border-white/10 outline-none"
          aria-label="Pixel Dash platform game. Use A and D or arrow keys to move; Space to jump."
        />
        {rendererError && <div role="alert" className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/95 p-6 text-center text-sm font-medium text-rose-200">{rendererError}</div>}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>A / D or arrows to move · Space to jump · P to pause · R to restart</span>
        {complete && <span className="inline-flex items-center gap-1 font-bold text-amber-200"><Trophy className="h-3 w-3" /> {recordImproved ? 'New best time!' : 'Campaign complete'}</span>}
      </div>
    </section>
  );
};
