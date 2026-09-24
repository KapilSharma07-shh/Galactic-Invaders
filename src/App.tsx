/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Monitor,
  Shield,
  Trophy,
  Zap,
  Flame,
  Sparkles,
  ChevronRight,
  Crosshair,
  Skull
} from 'lucide-react';

// ==========================================
// SOUND ENGINE (Web Audio API Synthesizer)
// ==========================================
class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private ufoOsc: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Player laser shoot
  playLaser(isDouble = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isDouble ? 'sawtooth' : 'square';

      osc.frequency.setValueAtTime(isDouble ? 960 : 880, now);
      osc.frequency.exponentialRampToValueAtTime(isDouble ? 160 : 110, now + (isDouble ? 0.18 : 0.14));

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isDouble ? 0.18 : 0.14));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {}
  }

  // Alien bomb drop sound
  playAlienLaser() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // Invader marching heartbeat
  playMarch(noteIndex: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const freqs = [125, 108, 96, 82];
      const freq = freqs[noteIndex % freqs.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  // Explosion sound
  playExplosion(isLarge: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = isLarge ? 0.48 : 0.22;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLarge ? 450 : 700, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isLarge ? 0.28 : 0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // Bunker chip sound
  playBunkerHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // UFO flying siren
  startUfoSound() {
    if (!this.enabled || this.ufoOsc) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.ufoOsc = this.ctx.createOscillator();
      this.ufoGain = this.ctx.createGain();
      this.ufoOsc.type = 'sine';

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5, now);
      lfoGain.gain.setValueAtTime(100, now);

      this.ufoOsc.frequency.setValueAtTime(450, now);
      lfo.connect(this.ufoOsc.frequency);

      this.ufoGain.gain.setValueAtTime(0.07, now);

      this.ufoOsc.connect(this.ufoGain);
      this.ufoGain.connect(this.ctx.destination);

      this.ufoOsc.start(now);
      lfo.start(now);
    } catch {}
  }

  stopUfoSound() {
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoOsc.disconnect();
      } catch {}
      this.ufoOsc = null;
      this.ufoGain = null;
    }
  }

  // UFO destroyed bonus sound
  playUfoHit() {
    this.stopUfoSound();
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [350, 480, 600, 800].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.14, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.11);
      });
    } catch {}
  }

  // Powerup collect sound (arpeggio fanfare)
  playPowerup() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 554, 659, 880];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.13);
      });
    } catch {}
  }

  // Asteroid shatter sound
  playAsteroidHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // Boss Warning Siren
  playBossAlarm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.2, 0.4].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now + offset);
        osc.frequency.linearRampToValueAtTime(440, now + offset + 0.15);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.19);
      });
    } catch {}
  }

  // Wave victory fanfare
  playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        const start = now + idx * 0.11;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {}
  }
}

const soundEngine = new RetroSoundEngine();

// ==========================================
// LEVEL & GAME DATA STRUCTURES
// ==========================================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export interface LevelConfig {
  levelNum: number;
  name: string;
  subtitle: string;
  multiplier: number;
  hasAsteroids: boolean;
  hasDivers: boolean;
  hasArmored: boolean;
  isBoss: boolean;
  bgHue: string;
  accentColor: string;
}

export const LEVEL_DEFINITIONS: LevelConfig[] = [
  {
    levelNum: 1,
    name: 'SECTOR 1: NEBULA OUTPOST',
    subtitle: 'Classic Scout Fleet Formation',
    multiplier: 1.0,
    hasAsteroids: false,
    hasDivers: false,
    hasArmored: false,
    isBoss: false,
    bgHue: '#050711',
    accentColor: '#00f0ff',
  },
  {
    levelNum: 2,
    name: 'SECTOR 2: ASTEROID CORRIDOR',
    subtitle: 'Hazardous Floating Space Rocks',
    multiplier: 1.25,
    hasAsteroids: true,
    hasDivers: false,
    hasArmored: false,
    isBoss: false,
    bgHue: '#0a0916',
    accentColor: '#fbbf24',
  },
  {
    levelNum: 3,
    name: 'SECTOR 3: SOLAR SWARM',
    subtitle: 'Kamikaze Dive-Bombing Invaders',
    multiplier: 1.5,
    hasAsteroids: false,
    hasDivers: true,
    hasArmored: false,
    isBoss: false,
    bgHue: '#13070b',
    accentColor: '#f43f5e',
  },
  {
    levelNum: 4,
    name: 'SECTOR 4: CYBER VANGUARD',
    subtitle: 'Energy-Shielded Elite Troops',
    multiplier: 1.75,
    hasAsteroids: true,
    hasDivers: true,
    hasArmored: true,
    isBoss: false,
    bgHue: '#03100a',
    accentColor: '#10b981',
  },
  {
    levelNum: 5,
    name: 'SECTOR 5: MOTHERSHIP DREADNOUGHT',
    subtitle: 'Flagship Boss Encounter',
    multiplier: 2.5,
    hasAsteroids: false,
    hasDivers: true,
    hasArmored: true,
    isBoss: true,
    bgHue: '#110515',
    accentColor: '#c084fc',
  },
];

// Helper to get config for any level >= 1 (supports endless levels)
function getLevelConfig(lvl: number): LevelConfig {
  if (lvl <= 5) return LEVEL_DEFINITIONS[lvl - 1];
  // Dynamic procedural configuration for veteran cycles (Level 6+)
  return {
    levelNum: lvl,
    name: `HYPER SECTOR ${lvl}: BLACK HOLE`,
    subtitle: 'Maximum Hazard Veteran Armada',
    multiplier: 2.5 + (lvl - 5) * 0.5,
    hasAsteroids: true,
    hasDivers: true,
    hasArmored: true,
    isBoss: lvl % 5 === 0,
    bgHue: '#080312',
    accentColor: '#ec4899',
  };
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  isPlayer: boolean;
  damage?: number;
}

interface Invader {
  row: number;
  col: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  width: number;
  height: number;
  type: 'boss' | 'crab' | 'squid';
  points: number;
  alive: boolean;
  color: string;
  animFrame: number;
  maxHp: number;
  hp: number;
  isArmored?: boolean;
  isDiving?: boolean;
  diveAngle?: number;
  diveSpeed?: number;
}

interface ShieldBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: boolean[][];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

interface MysteryShip {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: 1 | -1;
  points: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  rotation: number;
  rotSpeed: number;
  points: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'double' | 'rapid' | 'shield' | 'bomb';
  label: string;
  color: string;
}

interface BossDreadnought {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  hp: number;
  maxHp: number;
  fireCooldown: number;
  droneSpawnCooldown: number;
  turretAngle: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level UI state
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WAVE_CLEAR' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('galactic_invaders_hi_score');
    return saved ? parseInt(saved, 10) || 5000 : 5000;
  });
  const [lives, setLives] = useState<number>(3);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [selectedStartLevel, setSelectedStartLevel] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('galactic_invaders_unlocked_level');
    return saved ? Math.max(1, parseInt(saved, 10) || 1) : 1;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activePowerUpName, setActivePowerUpName] = useState<string | null>(null);
  const [powerUpRemaining, setPowerUpRemaining] = useState<number>(0);

  // Key tracking
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  // Engine Ref (60FPS mutable state)
  const engineRef = useRef({
    score: 0,
    highScore: 5000,
    lives: 3,
    level: 1,
    gameState: 'START' as 'START' | 'PLAYING' | 'WAVE_CLEAR' | 'GAMEOVER',
    isPaused: false,
    player: {
      x: CANVAS_WIDTH / 2 - 22,
      y: CANVAS_HEIGHT - 55,
      width: 44,
      height: 28,
      speed: 380,
      cooldown: 0,
      invulnerableTimer: 0,
      doubleLaserTimer: 0,
      rapidFireTimer: 0,
    },
    bullets: [] as Bullet[],
    invaders: [] as Invader[],
    invaderDir: 1 as 1 | -1,
    invaderStepTimer: 0,
    invaderStepInterval: 0.85,
    invaderMoveStepX: 12,
    invaderDropStepY: 18,
    marchNoteIndex: 0,
    mysteryShip: {
      active: false,
      x: -60,
      y: 44,
      width: 52,
      height: 22,
      speed: 140,
      direction: 1 as 1 | -1,
      points: 150,
    } as MysteryShip,
    mysteryShipTimer: 16,
    shields: [] as ShieldBlock[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as Star[],
    asteroids: [] as Asteroid[],
    powerUps: [] as PowerUp[],
    boss: {
      active: false,
      x: CANVAS_WIDTH / 2 - 100,
      y: 60,
      width: 200,
      height: 70,
      vx: 90,
      hp: 60,
      maxHp: 60,
      fireCooldown: 1.5,
      droneSpawnCooldown: 6.0,
      turretAngle: 0,
    } as BossDreadnought,
    diveTimer: 4.0,
    waveTransitionTimer: 0,
    shakeDuration: 0,
    shotsFired: 0,
    shotsHit: 0,
    warpEffectTimer: 0,
  });

  // Keep high score ref in sync
  useEffect(() => {
    engineRef.current.highScore = highScore;
  }, [highScore]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.enabled = !next;
    if (next) soundEngine.stopUfoSound();
  };

  // ----------------------------------------------------
  // INITIALIZERS
  // ----------------------------------------------------
  const initStars = () => {
    const stars: Star[] = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 0.25 + Math.random() * 0.9,
        size: Math.random() > 0.85 ? 2.5 : Math.random() > 0.5 ? 1.8 : 1,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
    return stars;
  };

  const initShields = (): ShieldBlock[] => {
    const shields: ShieldBlock[] = [];
    const numShields = 4;
    const shieldWidth = 64;
    const shieldHeight = 44;
    const gap = (CANVAS_WIDTH - numShields * shieldWidth) / (numShields + 1);
    const cols = 16;
    const rows = 11;

    for (let s = 0; s < numShields; s++) {
      const sx = gap + s * (shieldWidth + gap);
      const sy = CANVAS_HEIGHT - 135;

      const pixels: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        pixels[r] = [];
        for (let c = 0; c < cols; c++) {
          let active = true;
          if (r >= rows - 4 && c >= 5 && c <= 10) active = false;
          if (r === 0 && (c < 2 || c >= cols - 2)) active = false;
          if (r === 1 && (c < 1 || c >= cols - 1)) active = false;
          pixels[r][c] = active;
        }
      }

      shields.push({ x: sx, y: sy, width: shieldWidth, height: shieldHeight, pixels });
    }
    return shields;
  };

  const initInvaders = (level: number): Invader[] => {
    const config = getLevelConfig(level);
    const invaders: Invader[] = [];

    // Boss level has a smaller escort wing around the flagship
    const rows = config.isBoss ? 3 : 5;
    const cols = 10;
    const alienWidth = 34;
    const alienHeight = 24;
    const xSpacing = 46;
    const ySpacing = 36;
    const startX = (CANVAS_WIDTH - cols * xSpacing) / 2 + 6;
    const startY = config.isBoss ? 150 : 85 + Math.min((level - 1) * 3, 30);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'boss' | 'crab' | 'squid' = 'squid';
        let points = 10;
        let color = '#22c55e';
        let maxHp = 1;
        let isArmored = false;

        if (r === 0) {
          type = 'boss';
          points = 40;
          color = '#ff0055';
          if (config.hasArmored) {
            isArmored = true;
            maxHp = 2;
            color = '#fbbf24'; // Armored gold
            points = 60;
          }
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          color = '#ec4899';
        } else {
          type = 'squid';
          points = 10;
          color = '#00f0ff';
        }

        const ix = startX + c * xSpacing;
        const iy = startY + r * ySpacing;

        invaders.push({
          row: r,
          col: c,
          x: ix,
          y: iy,
          homeX: ix,
          homeY: iy,
          width: alienWidth,
          height: alienHeight,
          type,
          points,
          alive: true,
          color,
          animFrame: 0,
          maxHp,
          hp: maxHp,
          isArmored,
          isDiving: false,
        });
      }
    }
    return invaders;
  };

  const spawnAsteroid = (): Asteroid => {
    const radius = 14 + Math.random() * 12;
    const fromLeft = Math.random() > 0.5;
    return {
      x: fromLeft ? -radius : CANVAS_WIDTH + radius,
      y: 100 + Math.random() * 220,
      vx: (fromLeft ? 1 : -1) * (30 + Math.random() * 45),
      vy: (Math.random() - 0.5) * 20,
      radius,
      hp: radius > 20 ? 3 : 2,
      maxHp: radius > 20 ? 3 : 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      points: 50,
    };
  };

  // ----------------------------------------------------
  // GAME START / LEVEL PROGRESSION
  // ----------------------------------------------------
  const startNewGame = useCallback((levelToStart = 1) => {
    const eng = engineRef.current;
    const config = getLevelConfig(levelToStart);

    eng.score = 0;
    eng.lives = 3;
    eng.level = levelToStart;
    eng.gameState = 'PLAYING';
    eng.player.x = CANVAS_WIDTH / 2 - 22;
    eng.player.invulnerableTimer = 0;
    eng.player.doubleLaserTimer = 0;
    eng.player.rapidFireTimer = 0;
    eng.bullets = [];
    eng.particles = [];
    eng.floatingTexts = [];
    eng.asteroids = [];
    eng.powerUps = [];
    eng.invaders = initInvaders(levelToStart);
    eng.shields = initShields();
    eng.invaderDir = 1;
    eng.invaderStepInterval = Math.max(0.26, 0.85 - (levelToStart - 1) * 0.09);
    eng.invaderStepTimer = 0;
    eng.marchNoteIndex = 0;
    eng.mysteryShip.active = false;
    eng.mysteryShipTimer = 16;
    eng.shotsFired = 0;
    eng.shotsHit = 0;
    eng.diveTimer = 4.0;
    eng.warpEffectTimer = 0;

    // Boss setup if level 5
    if (config.isBoss) {
      eng.boss.active = true;
      eng.boss.x = CANVAS_WIDTH / 2 - 100;
      eng.boss.y = 55;
      eng.boss.hp = 60 + (levelToStart - 5) * 25;
      eng.boss.maxHp = eng.boss.hp;
      eng.boss.fireCooldown = 1.4;
      eng.boss.droneSpawnCooldown = 5.0;
      soundEngine.playBossAlarm();
    } else {
      eng.boss.active = false;
    }

    setScore(0);
    setLives(3);
    setCurrentLevel(levelToStart);
    setGameState('PLAYING');
    setIsPaused(false);
    setActivePowerUpName(null);
    setPowerUpRemaining(0);
    soundEngine.stopUfoSound();
  }, []);

  const advanceToNextLevel = useCallback(() => {
    const eng = engineRef.current;
    const nextLvl = eng.level + 1;
    const config = getLevelConfig(nextLvl);

    eng.level = nextLvl;
    eng.gameState = 'PLAYING';
    eng.bullets = [];
    eng.asteroids = [];
    eng.powerUps = [];
    eng.invaders = initInvaders(nextLvl);
    eng.shields = initShields(); // Bunkers restored for next sector
    eng.invaderDir = 1;
    eng.invaderStepInterval = Math.max(0.2, 0.85 - (nextLvl - 1) * 0.08);
    eng.invaderStepTimer = 0;
    eng.mysteryShip.active = false;
    eng.mysteryShipTimer = 15;
    eng.diveTimer = 3.5;
    eng.warpEffectTimer = 1.5;

    // Boss check
    if (config.isBoss) {
      eng.boss.active = true;
      eng.boss.x = CANVAS_WIDTH / 2 - 100;
      eng.boss.y = 55;
      eng.boss.hp = 60 + (nextLvl - 5) * 25;
      eng.boss.maxHp = eng.boss.hp;
      eng.boss.fireCooldown = 1.4;
      eng.boss.droneSpawnCooldown = 5.0;
      soundEngine.playBossAlarm();
    } else {
      eng.boss.active = false;
    }

    // Persist unlocked level
    setUnlockedLevel((prev) => {
      const updated = Math.max(prev, nextLvl);
      localStorage.setItem('galactic_invaders_unlocked_level', updated.toString());
      return updated;
    });

    setCurrentLevel(nextLvl);
    setGameState('PLAYING');
  }, []);

  // ----------------------------------------------------
  // SHIELD & PARTICLE DAMAGE
  // ----------------------------------------------------
  const damageShield = (shield: ShieldBlock, worldX: number, worldY: number, radiusPx: number) => {
    const rows = shield.pixels.length;
    const cols = shield.pixels[0].length;
    const pxW = shield.width / cols;
    const pxH = shield.height / rows;
    const relX = worldX - shield.x;
    const relY = worldY - shield.y;
    let hit = false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shield.pixels[r][c]) {
          const pixelCenterX = c * pxW + pxW / 2;
          const pixelCenterY = r * pxH + pxH / 2;
          const dx = pixelCenterX - relX;
          const dy = pixelCenterY - relY;
          if (dx * dx + dy * dy <= radiusPx * radiusPx) {
            shield.pixels[r][c] = false;
            hit = true;
            if (Math.random() > 0.6) {
              engineRef.current.particles.push({
                x: shield.x + pixelCenterX,
                y: shield.y + pixelCenterY,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                color: '#22c55e',
                life: 0.3,
                maxLife: 0.3,
                size: 2,
              });
            }
          }
        }
      }
    }
    if (hit) soundEngine.playBunkerHit();
    return hit;
  };

  const checkShieldHit = (shield: ShieldBlock, bx: number, by: number, bw: number, bh: number): boolean => {
    if (
      bx + bw < shield.x ||
      bx > shield.x + shield.width ||
      by + bh < shield.y ||
      by > shield.y + shield.height
    ) {
      return false;
    }
    const rows = shield.pixels.length;
    const cols = shield.pixels[0].length;
    const pxW = shield.width / cols;
    const pxH = shield.height / rows;
    const relX = bx + bw / 2 - shield.x;
    const relY = by + bh / 2 - shield.y;
    const c = Math.floor(relX / pxW);
    const r = Math.floor(relY / pxH);
    return r >= 0 && r < rows && c >= 0 && c < cols && shield.pixels[r][c];
  };

  const createExplosion = (x: number, y: number, color: string, count = 18, isLarge = false) => {
    const eng = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isLarge ? 240 : 130);
      eng.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  };

  // Drop random powerup
  const maybeSpawnPowerUp = (x: number, y: number) => {
    const rand = Math.random();
    if (rand < 0.18) {
      const types: Array<'double' | 'rapid' | 'shield' | 'bomb'> = ['double', 'rapid', 'shield', 'bomb'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      let label = 'D';
      let color = '#00f0ff';

      if (chosen === 'rapid') {
        label = 'R';
        color = '#f59e0b';
      } else if (chosen === 'shield') {
        label = 'S';
        color = '#10b981';
      } else if (chosen === 'bomb') {
        label = 'B';
        color = '#f43f5e';
      }

      engineRef.current.powerUps.push({
        x,
        y,
        vy: 110,
        type: chosen,
        label,
        color,
      });
    }
  };

  // ----------------------------------------------------
  // KEYBOARD LISTENERS
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.code === 'Space') {
        keysRef.current.shoot = true;
        const eng = engineRef.current;
        if (eng.gameState === 'START' || eng.gameState === 'GAMEOVER') {
          startNewGame(selectedStartLevel);
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (engineRef.current.gameState === 'PLAYING') {
          setIsPaused((prev) => {
            engineRef.current.isPaused = !prev;
            return !prev;
          });
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.code === 'Space') keysRef.current.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNewGame, selectedStartLevel]);

  // ----------------------------------------------------
  // MAIN GAME LOOP (REQUEST ANIMATION FRAME)
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engineRef.current.stars = initStars();
    engineRef.current.shields = initShields();
    engineRef.current.invaders = initInvaders(1);

    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const eng = engineRef.current;
      const config = getLevelConfig(eng.level);

      // =================================================
      // SIMULATION UPDATE
      // =================================================
      if (!eng.isPaused) {
        // Starfield
        const starSpeedMod = eng.warpEffectTimer > 0 ? 8 : 1;
        eng.stars.forEach((star) => {
          star.y += star.speed * (dt * 60) * starSpeedMod;
          if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
          }
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(now * 0.002 * star.twinkleSpeed));
        });

        if (eng.warpEffectTimer > 0) {
          eng.warpEffectTimer -= dt;
        }

        if (eng.shakeDuration > 0) {
          eng.shakeDuration -= dt;
        }

        // Active powerup timers
        if (eng.player.doubleLaserTimer > 0) {
          eng.player.doubleLaserTimer -= dt;
          if (eng.player.doubleLaserTimer <= 0) {
            setActivePowerUpName(null);
          } else {
            setActivePowerUpName('DOUBLE LASER');
            setPowerUpRemaining(Math.ceil(eng.player.doubleLaserTimer));
          }
        }
        if (eng.player.rapidFireTimer > 0) {
          eng.player.rapidFireTimer -= dt;
          if (eng.player.rapidFireTimer <= 0 && eng.player.doubleLaserTimer <= 0) {
            setActivePowerUpName(null);
          } else if (eng.player.rapidFireTimer > 0) {
            setActivePowerUpName('RAPID FIRE');
            setPowerUpRemaining(Math.ceil(eng.player.rapidFireTimer));
          }
        }

        // PLAYING STATE
        if (eng.gameState === 'PLAYING') {
          const player = eng.player;

          // Player Movement
          if (keysRef.current.left) player.x = Math.max(16, player.x - player.speed * dt);
          if (keysRef.current.right) player.x = Math.min(CANVAS_WIDTH - player.width - 16, player.x + player.speed * dt);

          if (player.cooldown > 0) player.cooldown -= dt;
          if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

          // Player Shooting
          const baseCooldown = player.rapidFireTimer > 0 ? 0.12 : 0.24;
          const maxBullets = player.doubleLaserTimer > 0 ? 4 : 2;

          if (keysRef.current.shoot && player.cooldown <= 0) {
            const playerBullets = eng.bullets.filter((b) => b.isPlayer);
            if (playerBullets.length < maxBullets) {
              if (player.doubleLaserTimer > 0) {
                // Twin Lasers
                eng.bullets.push(
                  {
                    x: player.x + 6,
                    y: player.y - 4,
                    vx: 0,
                    vy: -600,
                    width: 4,
                    height: 14,
                    color: '#00f0ff',
                    isPlayer: true,
                  },
                  {
                    x: player.x + player.width - 10,
                    y: player.y - 4,
                    vx: 0,
                    vy: -600,
                    width: 4,
                    height: 14,
                    color: '#00f0ff',
                    isPlayer: true,
                  }
                );
                soundEngine.playLaser(true);
                eng.shotsFired += 2;
              } else {
                eng.bullets.push({
                  x: player.x + player.width / 2 - 2,
                  y: player.y - 4,
                  vx: 0,
                  vy: -580,
                  width: 4,
                  height: 14,
                  color: '#00f0ff',
                  isPlayer: true,
                });
                soundEngine.playLaser(false);
                eng.shotsFired += 1;
              }
              player.cooldown = baseCooldown;
            }
          }

          // Level Specific Hazard: Drifting Asteroids
          if (config.hasAsteroids) {
            if (eng.asteroids.length < 3 && Math.random() < 0.015) {
              eng.asteroids.push(spawnAsteroid());
            }

            for (let i = eng.asteroids.length - 1; i >= 0; i--) {
              const ast = eng.asteroids[i];
              ast.x += ast.vx * dt;
              ast.y += ast.vy * dt;
              ast.rotation += ast.rotSpeed * dt;

              // Bounds check
              if (ast.x < -60 || ast.x > CANVAS_WIDTH + 60 || ast.y > CANVAS_HEIGHT + 60) {
                eng.asteroids.splice(i, 1);
                continue;
              }

              // Asteroid vs Player Collision
              const distToPlayer = Math.hypot(
                ast.x - (player.x + player.width / 2),
                ast.y - (player.y + player.height / 2)
              );
              if (player.invulnerableTimer <= 0 && distToPlayer < ast.radius + 16) {
                eng.lives -= 1;
                setLives(eng.lives);
                soundEngine.playExplosion(true);
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00f0ff', 40, true);
                eng.shakeDuration = 0.4;
                player.invulnerableTimer = 2.0;
                eng.asteroids.splice(i, 1);

                if (eng.lives <= 0) {
                  eng.gameState = 'GAMEOVER';
                  setGameState('GAMEOVER');
                  soundEngine.stopUfoSound();
                }
              }
            }
          }

          // Level Specific Hazard: Galaga Dive-Bombing Invaders
          if (config.hasDivers) {
            eng.diveTimer -= dt;
            if (eng.diveTimer <= 0) {
              eng.diveTimer = 4.0 + Math.random() * 3.0;
              const aliveNonDiving = eng.invaders.filter((inv) => inv.alive && !inv.isDiving);
              if (aliveNonDiving.length > 0) {
                const diver = aliveNonDiving[Math.floor(Math.random() * aliveNonDiving.length)];
                diver.isDiving = true;
                diver.diveSpeed = 220;
                diver.diveAngle = Math.PI / 2; // downwards
              }
            }
          }

          // Update Diving Aliens
          eng.invaders.forEach((inv) => {
            if (inv.alive && inv.isDiving) {
              const targetX = player.x + player.width / 2;
              const dx = targetX - inv.x;
              // Smooth swoop tracking towards player
              inv.x += Math.sign(dx) * 85 * dt;
              inv.y += inv.diveSpeed! * dt;

              // Fire laser while diving
              if (Math.random() < 0.03 && eng.bullets.filter((b) => !b.isPlayer).length < 5) {
                eng.bullets.push({
                  x: inv.x + inv.width / 2 - 2,
                  y: inv.y + inv.height,
                  vx: (Math.random() - 0.5) * 60,
                  vy: 260,
                  width: 4,
                  height: 12,
                  color: '#ff0055',
                  isPlayer: false,
                });
                soundEngine.playAlienLaser();
              }

              // Reached bottom of screen -> Loop back to top
              if (inv.y > CANVAS_HEIGHT + 20) {
                inv.y = -30;
                inv.isDiving = false;
              }
            }
          });

          // Level Specific Boss: Dreadnought Mothership
          if (config.isBoss && eng.boss.active) {
            const boss = eng.boss;
            boss.x += boss.vx * dt;
            if (boss.x < 30 || boss.x + boss.width > CANVAS_WIDTH - 30) {
              boss.vx *= -1;
            }

            // Boss Turret Attacks
            boss.fireCooldown -= dt;
            if (boss.fireCooldown <= 0) {
              boss.fireCooldown = 1.3;
              // Triple spread laser attack
              [-60, 0, 60].forEach((spreadVx) => {
                eng.bullets.push({
                  x: boss.x + boss.width / 2 - 2,
                  y: boss.y + boss.height - 4,
                  vx: spreadVx,
                  vy: 240,
                  width: 6,
                  height: 16,
                  color: '#c084fc',
                  isPlayer: false,
                });
              });
              soundEngine.playAlienLaser();
            }

            // Boss Spawn Escort Drones
            boss.droneSpawnCooldown -= dt;
            if (boss.droneSpawnCooldown <= 0) {
              boss.droneSpawnCooldown = 5.5;
              eng.invaders.push({
                row: 99,
                col: 99,
                x: boss.x + boss.width / 2 - 17,
                y: boss.y + boss.height + 4,
                homeX: boss.x + boss.width / 2,
                homeY: boss.y + boss.height + 4,
                width: 34,
                height: 24,
                type: 'squid',
                points: 20,
                alive: true,
                color: '#c084fc',
                animFrame: 0,
                maxHp: 1,
                hp: 1,
                isDiving: true,
                diveSpeed: 190,
              });
            }
          }

          // Mystery Ship Logic
          eng.mysteryShipTimer -= dt;
          if (eng.mysteryShipTimer <= 0 && !eng.mysteryShip.active) {
            eng.mysteryShip.active = true;
            eng.mysteryShip.direction = Math.random() > 0.5 ? 1 : -1;
            eng.mysteryShip.x = eng.mysteryShip.direction === 1 ? -60 : CANVAS_WIDTH + 10;
            eng.mysteryShip.y = 44;
            eng.mysteryShip.speed = 145;
            eng.mysteryShip.points = [100, 150, 200, 300][Math.floor(Math.random() * 4)];
            soundEngine.startUfoSound();
          }

          if (eng.mysteryShip.active) {
            eng.mysteryShip.x += eng.mysteryShip.speed * eng.mysteryShip.direction * dt;
            if (
              (eng.mysteryShip.direction === 1 && eng.mysteryShip.x > CANVAS_WIDTH + 70) ||
              (eng.mysteryShip.direction === -1 && eng.mysteryShip.x < -70)
            ) {
              eng.mysteryShip.active = false;
              eng.mysteryShipTimer = 18 + Math.random() * 12;
              soundEngine.stopUfoSound();
            }
          }

          // Invader Fleet Movement (Grid march)
          const livingInvaders = eng.invaders.filter((inv) => inv.alive);
          const isBossFightWon = config.isBoss ? !eng.boss.active && livingInvaders.length === 0 : livingInvaders.length === 0;

          if (isBossFightWon) {
            // Level / Sector cleared!
            eng.gameState = 'WAVE_CLEAR';
            eng.waveTransitionTimer = 2.6;
            setGameState('WAVE_CLEAR');
            soundEngine.playVictory();
          } else {
            const aliveRatio = livingInvaders.length / (config.isBoss ? 20 : 50);
            const currentStepInterval = Math.max(0.08, eng.invaderStepInterval * (0.15 + aliveRatio * 0.85));

            eng.invaderStepTimer += dt;
            if (eng.invaderStepTimer >= currentStepInterval) {
              eng.invaderStepTimer = 0;
              eng.marchNoteIndex = (eng.marchNoteIndex + 1) % 4;
              soundEngine.playMarch(eng.marchNoteIndex);

              let hitBoundary = false;
              for (const inv of livingInvaders) {
                if (inv.isDiving) continue;
                const nextX = inv.x + eng.invaderMoveStepX * eng.invaderDir;
                if (nextX < 24 || nextX + inv.width > CANVAS_WIDTH - 24) {
                  hitBoundary = true;
                  break;
                }
              }

              if (hitBoundary) {
                eng.invaderDir = (eng.invaderDir * -1) as 1 | -1;
                for (const inv of livingInvaders) {
                  if (inv.isDiving) continue;
                  inv.y += eng.invaderDropStepY;
                  inv.animFrame = inv.animFrame === 0 ? 1 : 0;
                  if (inv.y + inv.height >= player.y) {
                    eng.gameState = 'GAMEOVER';
                    setGameState('GAMEOVER');
                    soundEngine.stopUfoSound();
                    soundEngine.playExplosion(true);
                    break;
                  }
                }
              } else {
                for (const inv of livingInvaders) {
                  if (inv.isDiving) continue;
                  inv.x += eng.invaderMoveStepX * eng.invaderDir;
                  inv.animFrame = inv.animFrame === 0 ? 1 : 0;
                }
              }

              // Bomb drops
              const fireChance = 0.5 + eng.level * 0.08;
              if (Math.random() < fireChance && eng.bullets.filter((b) => !b.isPlayer).length < 4 + eng.level) {
                const livingCols = Array.from(new Set(livingInvaders.filter((i) => !i.isDiving).map((inv) => inv.col)));
                if (livingCols.length > 0) {
                  const randomCol = livingCols[Math.floor(Math.random() * livingCols.length)];
                  const colInvaders = livingInvaders.filter((inv) => inv.col === randomCol && !inv.isDiving);
                  if (colInvaders.length > 0) {
                    const bottomInvader = colInvaders.reduce((prev, curr) => (curr.row > prev.row ? curr : prev));
                    eng.bullets.push({
                      x: bottomInvader.x + bottomInvader.width / 2 - 2,
                      y: bottomInvader.y + bottomInvader.height + 2,
                      vx: 0,
                      vy: 230 + Math.min(eng.level * 25, 130),
                      width: 4,
                      height: 12,
                      color: '#ff0055',
                      isPlayer: false,
                    });
                    soundEngine.playAlienLaser();
                  }
                }
              }
            }
          }

          // Update PowerUp Items
          for (let i = eng.powerUps.length - 1; i >= 0; i--) {
            const pu = eng.powerUps[i];
            pu.y += pu.vy * dt;

            // Player pickup
            if (
              pu.x + 18 >= player.x &&
              pu.x <= player.x + player.width &&
              pu.y + 18 >= player.y &&
              pu.y <= player.y + player.height
            ) {
              soundEngine.playPowerup();
              eng.score += 150;
              setScore(eng.score);

              // Apply Powerup
              if (pu.type === 'double') {
                player.doubleLaserTimer = 14;
                setActivePowerUpName('DOUBLE LASER');
                setPowerUpRemaining(14);
              } else if (pu.type === 'rapid') {
                player.rapidFireTimer = 12;
                setActivePowerUpName('RAPID FIRE');
                setPowerUpRemaining(12);
              } else if (pu.type === 'shield') {
                eng.shields = initShields(); // Full bunker repair!
                eng.floatingTexts.push({
                  text: 'BUNKERS REPAIRED!',
                  x: CANVAS_WIDTH / 2 - 70,
                  y: CANVAS_HEIGHT - 160,
                  color: '#10b981',
                  life: 1.5,
                  maxLife: 1.5,
                });
              } else if (pu.type === 'bomb') {
                // Wipe enemy bullets & shock enemies
                eng.bullets = eng.bullets.filter((b) => b.isPlayer);
                createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#f43f5e', 80, true);
                eng.shakeDuration = 0.35;
                eng.floatingTexts.push({
                  text: 'EMP SMART BOMB!',
                  x: CANVAS_WIDTH / 2 - 60,
                  y: CANVAS_HEIGHT / 2,
                  color: '#f43f5e',
                  life: 1.5,
                  maxLife: 1.5,
                });
              }

              eng.powerUps.splice(i, 1);
              continue;
            }

            if (pu.y > CANVAS_HEIGHT + 20) {
              eng.powerUps.splice(i, 1);
            }
          }

          // Bullet Movements & Collisions
          for (let i = eng.bullets.length - 1; i >= 0; i--) {
            const b = eng.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (b.y < 10 || b.y > CANVAS_HEIGHT + 10 || b.x < 0 || b.x > CANVAS_WIDTH) {
              eng.bullets.splice(i, 1);
              continue;
            }

            let bulletRemoved = false;

            // Shield Collisions
            for (const shield of eng.shields) {
              if (checkShieldHit(shield, b.x, b.y, b.width, b.height)) {
                damageShield(shield, b.x + b.width / 2, b.y + (b.isPlayer ? 0 : b.height), 8);
                eng.bullets.splice(i, 1);
                bulletRemoved = true;
                break;
              }
            }
            if (bulletRemoved) continue;

            // Asteroid Collisions
            for (let j = eng.asteroids.length - 1; j >= 0; j--) {
              const ast = eng.asteroids[j];
              const dist = Math.hypot(ast.x - b.x, ast.y - b.y);
              if (dist < ast.radius) {
                soundEngine.playAsteroidHit();
                createExplosion(b.x, b.y, '#fbbf24', 8);
                eng.bullets.splice(i, 1);
                bulletRemoved = true;

                if (b.isPlayer) {
                  ast.hp -= 1;
                  if (ast.hp <= 0) {
                    soundEngine.playExplosion(false);
                    createExplosion(ast.x, ast.y, '#f59e0b', 24);
                    eng.score += Math.floor(ast.points * config.multiplier);
                    setScore(eng.score);
                    maybeSpawnPowerUp(ast.x, ast.y);
                    eng.asteroids.splice(j, 1);
                  }
                }
                break;
              }
            }
            if (bulletRemoved) continue;

            if (b.isPlayer) {
              // Hit Boss Mothership
              if (config.isBoss && eng.boss.active) {
                const boss = eng.boss;
                if (
                  b.x + b.width >= boss.x &&
                  b.x <= boss.x + boss.width &&
                  b.y <= boss.y + boss.height &&
                  b.y + b.height >= boss.y
                ) {
                  eng.shotsHit += 1;
                  boss.hp -= 1;
                  soundEngine.playBunkerHit();
                  createExplosion(b.x, b.y, '#c084fc', 6);

                  if (boss.hp <= 0) {
                    boss.active = false;
                    soundEngine.playExplosion(true);
                    createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#c084fc', 80, true);
                    const bossPts = Math.floor(2000 * config.multiplier);
                    eng.score += bossPts;
                    setScore(eng.score);
                    eng.shakeDuration = 0.5;

                    eng.floatingTexts.push({
                      text: `BOSS DESTROYED! +${bossPts}`,
                      x: boss.x + 20,
                      y: boss.y + 20,
                      color: '#c084fc',
                      life: 2.0,
                      maxLife: 2.0,
                    });
                  }

                  eng.bullets.splice(i, 1);
                  continue;
                }
              }

              // Hit Mystery UFO
              if (eng.mysteryShip.active) {
                const ms = eng.mysteryShip;
                if (
                  b.x + b.width >= ms.x &&
                  b.x <= ms.x + ms.width &&
                  b.y <= ms.y + ms.height &&
                  b.y + b.height >= ms.y
                ) {
                  eng.shotsHit += 1;
                  ms.active = false;
                  soundEngine.playUfoHit();
                  createExplosion(ms.x + ms.width / 2, ms.y + ms.height / 2, '#ff1744', 35, true);
                  const bonusPts = Math.floor(ms.points * config.multiplier);
                  eng.score += bonusPts;
                  eng.shakeDuration = 0.25;

                  maybeSpawnPowerUp(ms.x + ms.width / 2, ms.y + ms.height / 2);

                  eng.floatingTexts.push({
                    text: `+${bonusPts}`,
                    x: ms.x + 10,
                    y: ms.y,
                    color: '#ff1744',
                    life: 1.2,
                    maxLife: 1.2,
                  });

                  if (eng.score > eng.highScore) {
                    eng.highScore = eng.score;
                    setHighScore(eng.score);
                    localStorage.setItem('galactic_invaders_hi_score', eng.score.toString());
                  }
                  setScore(eng.score);

                  eng.bullets.splice(i, 1);
                  continue;
                }
              }

              // Hit Invader
              for (const inv of livingInvaders) {
                if (
                  b.x + b.width >= inv.x &&
                  b.x <= inv.x + inv.width &&
                  b.y <= inv.y + inv.height &&
                  b.y + b.height >= inv.y
                ) {
                  eng.shotsHit += 1;
                  inv.hp -= 1;

                  if (inv.hp <= 0) {
                    inv.alive = false;
                    soundEngine.playExplosion(inv.type === 'boss');
                    createExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color, 16);

                    const earnedPts = Math.floor(inv.points * config.multiplier);
                    eng.score += earnedPts;

                    if (eng.score > eng.highScore) {
                      eng.highScore = eng.score;
                      setHighScore(eng.score);
                      localStorage.setItem('galactic_invaders_hi_score', eng.score.toString());
                    }
                    setScore(eng.score);

                    maybeSpawnPowerUp(inv.x + inv.width / 2, inv.y + inv.height / 2);

                    eng.floatingTexts.push({
                      text: `+${earnedPts}`,
                      x: inv.x + 6,
                      y: inv.y,
                      color: inv.color,
                      life: 0.7,
                      maxLife: 0.7,
                    });
                  } else {
                    // Armored alien took 1 hit
                    soundEngine.playBunkerHit();
                    createExplosion(b.x, b.y, '#ffffff', 8);
                    inv.color = '#e2e8f0'; // Flash silver armor damage
                  }

                  eng.bullets.splice(i, 1);
                  bulletRemoved = true;
                  break;
                }
              }
              if (bulletRemoved) continue;
            } else {
              // Enemy Bullet vs Player
              if (
                player.invulnerableTimer <= 0 &&
                b.x + b.width >= player.x + 4 &&
                b.x <= player.x + player.width - 4 &&
                b.y + b.height >= player.y + 4 &&
                b.y <= player.y + player.height
              ) {
                eng.lives -= 1;
                setLives(eng.lives);
                soundEngine.playExplosion(true);
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00f0ff', 40, true);
                eng.shakeDuration = 0.4;
                player.invulnerableTimer = 2.0;
                eng.bullets.splice(i, 1);

                if (eng.lives <= 0) {
                  eng.gameState = 'GAMEOVER';
                  setGameState('GAMEOVER');
                  soundEngine.stopUfoSound();
                }
                continue;
              }
            }
          }
        } else if (eng.gameState === 'WAVE_CLEAR') {
          eng.waveTransitionTimer -= dt;
          if (eng.waveTransitionTimer <= 0) {
            advanceToNextLevel();
          }
        }

        // Particles & Floating Text
        for (let i = eng.particles.length - 1; i >= 0; i--) {
          const p = eng.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) eng.particles.splice(i, 1);
        }

        for (let i = eng.floatingTexts.length - 1; i >= 0; i--) {
          const ft = eng.floatingTexts[i];
          ft.y -= 25 * dt;
          ft.life -= dt;
          if (ft.life <= 0) eng.floatingTexts.splice(i, 1);
        }
      }

      // =================================================
      // RENDER PIPELINE
      // =================================================
      ctx.save();

      if (eng.shakeDuration > 0) {
        const magnitude = 6 * (eng.shakeDuration / 0.4);
        ctx.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
      }

      // Background with Level Sector Tint
      ctx.fillStyle = config.bgHue;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Starfield (with Warp Lines if transitioning)
      eng.stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        if (eng.warpEffectTimer > 0) {
          ctx.fillRect(star.x, star.y, 1.5, star.size * 12);
        } else {
          ctx.fillRect(star.x, star.y, star.size, star.size);
        }
      });

      // Bottom Defense Boundary
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, CANVAS_HEIGHT - 20);
      ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
      ctx.stroke();

      // Draw Shields
      eng.shields.forEach((shield) => {
        const rows = shield.pixels.length;
        const cols = shield.pixels[0].length;
        const pxW = shield.width / cols;
        const pxH = shield.height / rows;
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 4;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (shield.pixels[r][c]) {
              ctx.fillRect(shield.x + c * pxW, shield.y + r * pxH, pxW + 0.5, pxH + 0.5);
            }
          }
        }
        ctx.shadowBlur = 0;
      });

      // Draw Asteroids
      eng.asteroids.forEach((ast) => {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);
        ctx.strokeStyle = '#fbbf24';
        ctx.fillStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        const pts = 7;
        for (let p = 0; p < pts; p++) {
          const a = (p / pts) * Math.PI * 2;
          const r = ast.radius * (0.8 + 0.2 * ((p % 2) * 2 - 1));
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cracks / craters
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-ast.radius / 3, -ast.radius / 3, 5, 5);
        ctx.restore();
      });

      // Draw Boss Mothership Dreadnought
      if (config.isBoss && eng.boss.active) {
        const boss = eng.boss;
        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 14;

        // Dreadnought hull
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(boss.width * 0.2, 0);
        ctx.lineTo(boss.width * 0.8, 0);
        ctx.lineTo(boss.width, 20);
        ctx.lineTo(boss.width * 0.7, boss.height);
        ctx.lineTo(boss.width * 0.3, boss.height);
        ctx.closePath();
        ctx.fill();

        // Glowing core
        ctx.fillStyle = Math.floor(now / 100) % 2 === 0 ? '#f43f5e' : '#38bdf8';
        ctx.fillRect(boss.width / 2 - 16, boss.height / 2 - 10, 32, 20);

        // Wing cannons
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(10, boss.height - 15, 14, 20);
        ctx.fillRect(boss.width - 24, boss.height - 15, 14, 20);

        // Health Bar above Boss
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#334155';
        ctx.fillRect(10, -16, boss.width - 20, 8);
        const hpPct = Math.max(0, boss.hp / boss.maxHp);
        ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(10, -16, (boss.width - 20) * hpPct, 8);

        ctx.restore();
      }

      // Draw Invaders
      eng.invaders.forEach((inv) => {
        if (!inv.alive) return;
        ctx.save();
        ctx.translate(inv.x, inv.y);
        ctx.shadowColor = inv.color;
        ctx.shadowBlur = inv.isArmored ? 10 : 6;
        ctx.fillStyle = inv.color;

        const f = inv.animFrame;
        if (inv.type === 'boss') {
          ctx.fillRect(12, 0, 10, 4);
          ctx.fillRect(8, 4, 18, 4);
          ctx.fillRect(4, 8, 26, 4);
          ctx.fillRect(2, 12, 30, 4);
          ctx.fillRect(0, 16, 34, 4);
          ctx.fillStyle = inv.isArmored ? '#ffffff' : '#fef08a';
          ctx.fillRect(10, 8, 4, 4);
          ctx.fillRect(20, 8, 4, 4);
          ctx.fillStyle = inv.color;
          if (f === 0) {
            ctx.fillRect(4, 20, 6, 4);
            ctx.fillRect(24, 20, 6, 4);
            ctx.fillRect(0, 20, 3, 4);
            ctx.fillRect(31, 20, 3, 4);
          } else {
            ctx.fillRect(8, 20, 6, 4);
            ctx.fillRect(20, 20, 6, 4);
            ctx.fillRect(2, 20, 4, 3);
            ctx.fillRect(28, 20, 4, 3);
          }
        } else if (inv.type === 'crab') {
          ctx.fillRect(10, 0, 14, 4);
          ctx.fillRect(6, 4, 22, 4);
          ctx.fillRect(4, 8, 26, 4);
          ctx.fillRect(2, 12, 30, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(8, 6, 3, 3);
          ctx.fillRect(23, 6, 3, 3);
          ctx.fillStyle = inv.color;
          if (f === 0) {
            ctx.fillRect(0, 8, 3, 10);
            ctx.fillRect(31, 8, 3, 10);
            ctx.fillRect(6, 16, 6, 6);
            ctx.fillRect(22, 16, 6, 6);
          } else {
            ctx.fillRect(0, 4, 3, 8);
            ctx.fillRect(31, 4, 3, 8);
            ctx.fillRect(10, 16, 4, 6);
            ctx.fillRect(20, 16, 4, 6);
          }
        } else {
          ctx.fillRect(12, 0, 10, 3);
          ctx.fillRect(8, 3, 18, 4);
          ctx.fillRect(6, 7, 22, 5);
          ctx.fillRect(4, 12, 26, 4);
          ctx.fillStyle = '#050711';
          ctx.fillRect(10, 7, 3, 3);
          ctx.fillRect(21, 7, 3, 3);
          ctx.fillStyle = inv.color;
          if (f === 0) {
            ctx.fillRect(2, 16, 5, 6);
            ctx.fillRect(14, 16, 6, 6);
            ctx.fillRect(27, 16, 5, 6);
          } else {
            ctx.fillRect(6, 16, 5, 6);
            ctx.fillRect(14, 16, 6, 4);
            ctx.fillRect(23, 16, 5, 6);
          }
        }
        ctx.restore();
      });

      // Draw Mystery UFO
      if (eng.mysteryShip.active) {
        const ms = eng.mysteryShip;
        ctx.save();
        ctx.translate(ms.x, ms.y);
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.ellipse(ms.width / 2, ms.height / 2 + 3, ms.width / 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ms.width / 2, ms.height / 2 - 2, 8, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = Math.floor(now / 120) % 2 === 0 ? '#facc15' : '#ffffff';
        ctx.fillRect(8, ms.height - 4, 4, 3);
        ctx.fillRect(ms.width / 2 - 2, ms.height - 4, 4, 3);
        ctx.fillRect(ms.width - 12, ms.height - 4, 4, 3);
        ctx.restore();
      }

      // Draw PowerUps floating down
      eng.powerUps.forEach((pu) => {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = pu.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 22, 22);
        ctx.fillRect(0, 0, 22, 22);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = pu.color;
        ctx.textAlign = 'center';
        ctx.fillText(pu.label, 11, 15);
        ctx.restore();
      });

      // Draw Player Ship
      if (eng.gameState !== 'GAMEOVER') {
        const player = eng.player;
        const isFlicker = player.invulnerableTimer > 0 && Math.floor(now / 80) % 2 === 0;
        if (!isFlicker) {
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.shadowColor = player.doubleLaserTimer > 0 ? '#f43f5e' : '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.fillStyle = player.doubleLaserTimer > 0 ? '#f43f5e' : '#00f0ff';

          ctx.fillRect(20, 0, 4, 12);
          ctx.fillRect(18, 6, 8, 14);
          ctx.fillRect(14, 12, 16, 10);
          ctx.fillRect(6, 16, 32, 8);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 10, 4, 16);
          ctx.fillRect(40, 10, 4, 16);
          ctx.fillRect(2, 6, 2, 6);
          ctx.fillRect(40, 6, 2, 6);

          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(20, 10, 4, 6);

          const flameH = 4 + Math.random() * 8;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(18, 24, 8, flameH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(20, 24 + flameH, 4, flameH / 2);
          ctx.restore();
        }
      }

      // Draw Bullets
      eng.bullets.forEach((b) => {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.restore();
      });

      // Draw Particles
      eng.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      // Draw Floating Texts
      eng.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // ------------------------------------------------
      // IN-CANVAS HUD (LEVEL SYSTEM HEADER)
      // ------------------------------------------------
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';

      // Left: Score & Multiplier
      ctx.fillText('SCORE', 24, 22);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(eng.score.toString().padStart(5, '0'), 24, 38);

      // Center: Level / Sector Name Badge
      ctx.textAlign = 'center';
      ctx.fillStyle = config.accentColor;
      ctx.fillText(config.name, CANVAS_WIDTH / 2, 22);
      ctx.fillStyle = '#64748b';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(`${config.multiplier}X SCORE MULTIPLIER`, CANVAS_WIDTH / 2, 36);

      // Right: High Score & Level Number
      ctx.textAlign = 'right';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('HIGH SCORE', CANVAS_WIDTH - 24, 22);
      ctx.fillStyle = '#facc15';
      ctx.fillText(eng.highScore.toString().padStart(5, '0'), CANVAS_WIDTH - 24, 38);
      ctx.textAlign = 'left';

      // Lives
      ctx.fillStyle = '#64748b';
      ctx.fillText('LIVES:', 24, CANVAS_HEIGHT - 6);
      for (let i = 0; i < eng.lives; i++) {
        const lx = 90 + i * 26;
        const ly = CANVAS_HEIGHT - 16;
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(lx + 8, ly, 4, 3);
        ctx.fillRect(lx + 4, ly + 3, 12, 4);
        ctx.fillRect(lx + 1, ly + 7, 18, 3);
      }

      // Enemies Left Gauge
      const remainingEnemies = eng.invaders.filter((i) => i.alive).length;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`THREATS: ${remainingEnemies}`, CANVAS_WIDTH - 160, CANVAS_HEIGHT - 6);

      // Wave Clear Intermission Screen
      if (eng.gameState === 'WAVE_CLEAR') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 80, CANVAS_WIDTH, 160);

        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#22c55e';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 14;
        ctx.fillText(`SECTOR ${eng.level} SECURED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#38bdf8';
        const accuracy = eng.shotsFired > 0 ? Math.round((eng.shotsHit / eng.shotsFired) * 100) : 100;
        ctx.fillText(`ACCURACY RATING: ${accuracy}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.fillStyle = '#f59e0b';
        ctx.fillText('HYPER-DRIVE WARPING TO NEXT SECTOR...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
        ctx.textAlign = 'left';
      }

      // Pause Overlay
      if (eng.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('PRESS P TO CONTINUE COMBAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
        ctx.textAlign = 'left';
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [advanceToNextLevel]);

  // Mobile Touch Handlers
  const handleTouch = (action: 'left' | 'right' | 'shoot', active: boolean) => {
    keysRef.current[action] = active;
    if (action === 'shoot' && active && (gameState === 'START' || gameState === 'GAMEOVER')) {
      startNewGame(selectedStartLevel);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 select-none font-mono">
      {/* Top Header Bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between pb-3 px-2 text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-xs sm:text-sm font-bold tracking-wider text-cyan-400 font-['Press_Start_2P',monospace]">
            GALACTIC INVADERS
          </h1>
          <span className="hidden md:inline-block px-2 py-0.5 text-[9px] font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
            LEVEL SYSTEM V2
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {activePowerUpName && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/80 border border-rose-600 text-rose-300 text-[10px] animate-pulse">
              <Zap size={12} className="text-yellow-400" />
              <span>{activePowerUpName} ({powerUpRemaining}s)</span>
            </div>
          )}

          <button
            onClick={toggleMute}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={() => {
              if (gameState === 'PLAYING') {
                setIsPaused((prev) => {
                  engineRef.current.isPaused = !prev;
                  return !prev;
                });
              }
            }}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Pause (P)"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`p-1.5 rounded transition-colors ${
              crtEffect ? 'bg-cyan-950 text-cyan-400 border border-cyan-700' : 'bg-slate-800 text-slate-400'
            }`}
            title="CRT Scanlines"
          >
            <Monitor size={16} />
          </button>
        </div>
      </div>

      {/* Main Arcade Frame */}
      <div className="relative my-2 w-full max-w-[800px] aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 sm:border-4 border-slate-800 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex items-center justify-center">
        {/* Canvas Screen */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain block bg-[#050711]"
        />

        {/* CRT Scanline Filter */}
        {crtEffect && (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] z-10" />
        )}

        {/* START SCREEN OVERLAY */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 overflow-y-auto">
            <h2 className="text-xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 mb-2 font-['Press_Start_2P',monospace] tracking-wider animate-pulse">
              GALACTIC INVADERS
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mb-4 max-w-md">
              Level System: Battle through hostile sectors with asteroid fields, dive-bombing Galaga swarms, and mothership bosses!
            </p>

            {/* Sector / Level Selection */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-lg p-3 mb-4">
              <div className="text-[10px] text-cyan-400 font-bold mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>SELECT STARTING SECTOR:</span>
                <span className="text-slate-500">MAX UNLOCKED: LVL {unlockedLevel}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {LEVEL_DEFINITIONS.map((lvl) => {
                  const isAvailable = lvl.levelNum <= unlockedLevel;
                  const isSelected = selectedStartLevel === lvl.levelNum;
                  return (
                    <button
                      key={lvl.levelNum}
                      disabled={!isAvailable}
                      onClick={() => setSelectedStartLevel(lvl.levelNum)}
                      className={`p-2 rounded border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : isAvailable
                          ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500'
                          : 'border-slate-800 bg-slate-950/60 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-xs font-['Press_Start_2P',monospace]">L{lvl.levelNum}</div>
                      <div className="text-[8px] truncate mt-1 text-slate-400">{lvl.multiplier}x</div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[9px] text-slate-400 mt-2 text-left italic">
                Selected: <span className="text-cyan-400">{LEVEL_DEFINITIONS[selectedStartLevel - 1]?.name}</span>
              </div>
            </div>

            {/* Power-up Guide */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 mb-4 w-full max-w-md text-left text-[9px] space-y-1">
              <div className="text-slate-400 font-semibold mb-1 text-center uppercase border-b border-slate-800 pb-1">
                * ARSENAL & POWER-UPS *
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>[D] DOUBLE LASER</span>
                <span>Twin Cannon Firepower</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>[R] RAPID FIRE</span>
                <span>50% Faster Laser Reload</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>[S] SHIELD REPAIR</span>
                <span>Fully Rebuilds 4 Bunkers</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>[B] SMART BOMB</span>
                <span>Clears Bullets & Shocks Foes</span>
              </div>
            </div>

            <button
              onClick={() => startNewGame(selectedStartLevel)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs sm:text-sm tracking-widest rounded transition-all shadow-[0_0_20px_rgba(6,182,212,0.6)] active:scale-95 cursor-pointer font-['Press_Start_2P',monospace]"
            >
              LAUNCH MISSION (SPACE)
            </button>
          </div>
        )}

        {/* GAME OVER SCREEN OVERLAY */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
            <h2 className="text-2xl sm:text-4xl font-black text-rose-600 mb-2 font-['Press_Start_2P',monospace] tracking-wider animate-bounce">
              GAME OVER
            </h2>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 my-4 w-full max-w-xs text-xs space-y-2.5 font-['Press_Start_2P',monospace]">
              <div className="flex items-center justify-between text-slate-400">
                <span>FINAL:</span>
                <span className="text-cyan-400">{score.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>SECTOR:</span>
                <span className="text-pink-400">LVL {currentLevel}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2">
                <span>ALL-TIME:</span>
                <span className="text-yellow-400">{highScore.toString().padStart(5, '0')}</span>
              </div>
            </div>

            <button
              onClick={() => startNewGame(selectedStartLevel)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs sm:text-sm tracking-widest rounded transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)] active:scale-95 cursor-pointer font-['Press_Start_2P',monospace] flex items-center gap-2"
            >
              <RotateCcw size={16} />
              PRESS SPACE TO RESTART
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-2 pt-2 gap-3 sm:hidden">
        <div className="flex gap-2">
          <button
            onPointerDown={() => handleTouch('left', true)}
            onPointerUp={() => handleTouch('left', false)}
            onPointerCancel={() => handleTouch('left', false)}
            className="w-16 h-14 bg-slate-800 active:bg-cyan-600 text-white font-black rounded-lg border border-slate-700 flex items-center justify-center text-xl shadow select-none active:scale-95"
          >
            ◀
          </button>
          <button
            onPointerDown={() => handleTouch('right', true)}
            onPointerUp={() => handleTouch('right', false)}
            onPointerCancel={() => handleTouch('right', false)}
            className="w-16 h-14 bg-slate-800 active:bg-cyan-600 text-white font-black rounded-lg border border-slate-700 flex items-center justify-center text-xl shadow select-none active:scale-95"
          >
            ▶
          </button>
        </div>

        <button
          onPointerDown={() => handleTouch('shoot', true)}
          onPointerUp={() => handleTouch('shoot', false)}
          onPointerCancel={() => handleTouch('shoot', false)}
          className="flex-1 max-w-[200px] h-14 bg-red-600 active:bg-red-500 text-white font-bold rounded-lg border border-red-500 flex items-center justify-center text-sm tracking-widest shadow select-none active:scale-95 font-['Press_Start_2P',monospace]"
        >
          FIRE
        </button>
      </div>

      {/* Arcade Level Summary Footer */}
      <footer className="w-full max-w-[800px] flex flex-wrap items-center justify-between px-3 pt-2 text-[10px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-emerald-500" />
          <span>Sector Progression & Checkpoints</span>
        </div>
        <div className="flex items-center gap-2">
          <Skull size={12} className="text-purple-400" />
          <span>Boss Mothership at Sector 5</span>
        </div>
        <div className="flex items-center gap-2">
          <Crosshair size={12} className="text-amber-500" />
          <span>Multiplier Scales per Level</span>
        </div>
      </footer>
    </div>
  );
}
