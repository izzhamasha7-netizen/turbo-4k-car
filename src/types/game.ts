export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type ResolutionPreset = '4K' | '1440P' | '1080P' | '720P';

export interface ResolutionConfig {
  name: string;
  width: number;
  height: number;
  label: string;
}

export const RESOLUTIONS: Record<ResolutionPreset, ResolutionConfig> = {
  '4K': { name: '4K Ultra HD', width: 2160, height: 3840, label: '2160 × 3840 (Native)' },
  '1440P': { name: '2K QHD', width: 1440, height: 2560, label: '1440 × 2560 (Balanced)' },
  '1080P': { name: 'Full HD', width: 1080, height: 1920, label: '1080 × 1920 (High FPS)' },
  '720P': { name: 'HD', width: 720, height: 1280, label: '720 × 1280 (Fast)' },
};

export interface CarModel {
  id: string;
  name: string;
  tagline: string;
  color: string;
  secondaryColor: string;
  glowColor: string;
  topSpeed: number; // in virtual units
  handling: number; // turn speed
  nitroCapacity: number;
  nitroDrainRate: number;
  special: string;
}

export interface PlayerCar {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  vx: number;
  tilt: number; // visual banking tilt -1 to 1
  color: string;
  secondaryColor: string;
  glowColor: string;
  nitro: number; // 0 to 100
  isBoosting: boolean;
  isBraking: boolean;
  hasShield: boolean;
  magnetTimer: number; // seconds remaining
  invulnerableTimer: number;
}

export type EnemyType = 'SEDAN' | 'SUPERCAR' | 'TRUCK' | 'POLICE';

export interface EnemyCar {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: EnemyType;
  color: string;
  roofColor: string;
  hasPassed: boolean;
  lane: number;
  sirenState?: number;
}

export type PickupType = 'COIN' | 'NITRO' | 'SHIELD' | 'MAGNET';

export interface Pickup {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: PickupType;
  rotation: number;
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'SPARK' | 'SMOKE' | 'FIRE' | 'COIN_POP' | 'DEBRIS';
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
}

export interface RoadScenery {
  y: number;
  side: 'left' | 'right';
  type: 'LAMP' | 'TREE' | 'BILLBOARD';
  color: string;
}

export interface GameStats {
  highScore: number;
  totalCoins: number;
  gamesPlayed: number;
  totalDistance: number;
  maxSpeed: number;
  closeCallsTotal: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  resolution: ResolutionPreset;
  controlMode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT';
  vibrationEnabled: boolean;
}
