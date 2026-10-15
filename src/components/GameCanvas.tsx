import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CarModel,
  EnemyCar,
  EnemyType,
  FloatingText,
  GameState,
  Particle,
  Pickup,
  PickupType,
  PlayerCar,
  RESOLUTIONS,
  ResolutionPreset,
  RoadScenery,
} from '../types/game';
import { sounds } from '../utils/sound';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  selectedCar: CarModel;
  resolution: ResolutionPreset;
  controlMode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT';
  soundEnabled: boolean;
  musicEnabled: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  nitro: number;
  setNitro: React.Dispatch<React.SetStateAction<number>>;
  speedKmh: number;
  setSpeedKmh: React.Dispatch<React.SetStateAction<number>>;
  hasShield: boolean;
  setHasShield: React.Dispatch<React.SetStateAction<boolean>>;
  multiplier: number;
  setMultiplier: React.Dispatch<React.SetStateAction<number>>;
  onGameOver: (finalScore: number, finalCoins: number, distance: number, maxSpeed: number, closeCalls: number) => void;
  isPaused: boolean;
  touchSteerInput: { left: boolean; right: boolean; boost: boolean; brake: boolean };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  selectedCar,
  resolution,
  controlMode,
  soundEnabled,
  musicEnabled,
  score,
  setScore,
  coins,
  setCoins,
  nitro,
  setNitro,
  speedKmh,
  setSpeedKmh,
  hasShield,
  setHasShield,
  multiplier,
  setMultiplier,
  onGameOver,
  isPaused,
  touchSteerInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4K Virtual Coordinates: 2160 x 3840
  const V_WIDTH = 2160;
  const V_HEIGHT = 3840;

  // Road geometry in 4K space
  const ROAD_LEFT = 240;
  const ROAD_RIGHT = 1920;
  const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT; // 1680
  const LANES_COUNT = 4;
  const LANE_WIDTH = ROAD_WIDTH / LANES_COUNT; // 420
  const LANE_CENTERS = [
    ROAD_LEFT + LANE_WIDTH * 0.5, // ~450
    ROAD_LEFT + LANE_WIDTH * 1.5, // ~870
    ROAD_LEFT + LANE_WIDTH * 2.5, // ~1290
    ROAD_LEFT + LANE_WIDTH * 3.5, // ~1710
  ];

  // Game internal state references (to avoid closures in 60fps loop)
  const playerRef = useRef<PlayerCar>({
    x: V_WIDTH / 2 - 150,
    y: V_HEIGHT - 650,
    width: 290,
    height: 520,
    targetX: V_WIDTH / 2 - 150,
    vx: 0,
    tilt: 0,
    color: selectedCar.color,
    secondaryColor: selectedCar.secondaryColor,
    glowColor: selectedCar.glowColor,
    nitro: 100,
    isBoosting: false,
    isBraking: false,
    hasShield: false,
    magnetTimer: 0,
    invulnerableTimer: 0,
  });

  const enemiesRef = useRef<EnemyCar[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const sceneriesRef = useRef<RoadScenery[]>([]);
  const skidMarksRef = useRef<{ x1: number; y1: number; x2: number; y2: number; alpha: number }[]>([]);

  const keysRef = useRef<{ left: boolean; right: boolean; boost: boolean; brake: boolean }>({
    left: false,
    right: false,
    boost: false,
    brake: false,
  });

  const touchDragX = useRef<number | null>(null);
  const roadScrollY = useRef<number>(0);
  const gameSpeedRef = useRef<number>(24);
  const baseSpeedRef = useRef<number>(24);
  const currentKmhRef = useRef<number>(120);
  const distanceRef = useRef<number>(0);
  const closeCallsRef = useRef<number>(0);
  const maxSpeedRecordRef = useRef<number>(120);
  const screenShakeRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Sync selected car properties
  useEffect(() => {
    playerRef.current.color = selectedCar.color;
    playerRef.current.secondaryColor = selectedCar.secondaryColor;
    playerRef.current.glowColor = selectedCar.glowColor;
  }, [selectedCar]);

  // Sync audio toggles
  useEffect(() => {
    sounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    sounds.setMusicEnabled(musicEnabled);
  }, [musicEnabled]);

  // Reset & start game
  const resetGame = useCallback(() => {
    playerRef.current = {
      x: V_WIDTH / 2 - 145,
      y: V_HEIGHT - 650,
      width: 290,
      height: 520,
      targetX: V_WIDTH / 2 - 145,
      vx: 0,
      tilt: 0,
      color: selectedCar.color,
      secondaryColor: selectedCar.secondaryColor,
      glowColor: selectedCar.glowColor,
      nitro: 100,
      isBoosting: false,
      isBraking: false,
      hasShield: false,
      magnetTimer: 0,
      invulnerableTimer: 0,
    };
    enemiesRef.current = [];
    pickupsRef.current = [];
    particlesRef.current = [];
    floatTextsRef.current = [];
    skidMarksRef.current = [];
    roadScrollY.current = 0;
    baseSpeedRef.current = 24;
    gameSpeedRef.current = 24;
    currentKmhRef.current = 120;
    distanceRef.current = 0;
    closeCallsRef.current = 0;
    maxSpeedRecordRef.current = 120;
    screenShakeRef.current = 0;

    setScore(0);
    setCoins(0);
    setNitro(100);
    setSpeedKmh(120);
    setHasShield(false);
    setMultiplier(1);

    // Initial roadside scenery
    sceneriesRef.current = [];
    for (let i = 0; i < 12; i++) {
      sceneriesRef.current.push({
        y: i * 350,
        side: i % 2 === 0 ? 'left' : 'right',
        type: i % 3 === 0 ? 'BILLBOARD' : i % 2 === 0 ? 'LAMP' : 'TREE',
        color: i % 2 === 0 ? '#38bdf8' : '#10b981',
      });
    }

    sounds.startEngine();
  }, [selectedCar, setScore, setCoins, setNitro, setSpeedKmh, setHasShield, setMultiplier]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      resetGame();
    } else {
      sounds.stopEngine();
    }
    return () => {
      sounds.stopEngine();
    };
  }, [gameState, resetGame]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.boost = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.brake = true;
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(isPaused ? 'PLAYING' : 'PAUSED');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.boost = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.brake = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isPaused, setGameState]);

  // Touch Drag handler directly on the canvas
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (controlMode !== 'TOUCH_DRAG' || gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;

    const clientX = touch.clientX - rect.left;
    const scaleX = V_WIDTH / rect.width;
    touchDragX.current = clientX * scaleX;
  };

  const handleTouchEnd = () => {
    touchDragX.current = null;
  };

  // Helper spawn functions
  const spawnEnemy = useCallback(() => {
    const laneIndex = Math.floor(Math.random() * LANE_CENTERS.length);
    const laneX = LANE_CENTERS[laneIndex];

    // Don't spawn if another enemy is already at the top of this lane
    const tooClose = enemiesRef.current.some(
      (e) => Math.abs(e.x - (laneX - 145)) < 180 && e.y < 300
    );
    if (tooClose) return;

    const types: EnemyType[] = ['SEDAN', 'SEDAN', 'SUPERCAR', 'TRUCK', 'POLICE'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = 290;
    let height = 500;
    let color = '#3b82f6';
    let roofColor = '#1d4ed8';
    let speedDiff = Math.random() * 8 - 4; // relative to road speed

    if (type === 'TRUCK') {
      width = 330;
      height = 760;
      color = '#e2e8f0';
      roofColor = '#94a3b8';
      speedDiff = -10; // slow moving barrier
    } else if (type === 'SUPERCAR') {
      width = 280;
      height = 490;
      color = '#f97316';
      roofColor = '#ea580c';
      speedDiff = 6;
    } else if (type === 'POLICE') {
      width = 290;
      height = 510;
      color = '#0f172a';
      roofColor = '#ffffff';
      speedDiff = 2;
    } else {
      const sedanColors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];
      color = sedanColors[Math.floor(Math.random() * sedanColors.length)];
      roofColor = '#0f172a';
    }

    enemiesRef.current.push({
      id: Date.now() + Math.random(),
      x: laneX - width / 2,
      y: -height - 100,
      width,
      height,
      speed: speedDiff,
      type,
      color,
      roofColor,
      hasPassed: false,
      lane: laneIndex,
      sirenState: 0,
    });
  }, [LANE_CENTERS]);

  const spawnPickup = useCallback(() => {
    const laneIndex = Math.floor(Math.random() * LANE_CENTERS.length);
    const laneX = LANE_CENTERS[laneIndex];

    const roll = Math.random();
    let type: PickupType = 'COIN';
    if (roll < 0.65) {
      type = 'COIN';
    } else if (roll < 0.8) {
      type = 'NITRO';
    } else if (roll < 0.92) {
      type = 'SHIELD';
    } else {
      type = 'MAGNET';
    }

    pickupsRef.current.push({
      id: Date.now() + Math.random(),
      x: laneX,
      y: -150,
      radius: 60,
      type,
      rotation: 0,
      value: type === 'COIN' ? 25 : 0,
    });
  }, [LANE_CENTERS]);

  // Collisions
  const checkAABB = (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    inset = 25
  ) => {
    return (
      ax + inset < bx + bw - inset &&
      ax + aw - inset > bx + inset &&
      ay + inset < by + bh - inset &&
      ay + ah - inset > by + inset
    );
  };

  // Spark and particle emitter
  const createParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    type: Particle['type'] = 'SPARK',
    speedMult = 1
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 20 + 8) * speedMult;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: Math.random() * 25 + 15,
        color,
        size: Math.random() * 22 + 8,
        type,
      });
    }
  };

  const addFloatText = (text: string, x: number, y: number, color = '#facc15') => {
    floatTextsRef.current.push({
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      color,
      size: 72,
      opacity: 1,
      life: 0,
    });
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let isRunning = true;

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        updateGame(dt);
      }

      renderGame();

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  });

  // Game update logic
  const updateGame = (dt: number) => {
    const player = playerRef.current;

    // Gradual difficulty ramp
    baseSpeedRef.current += dt * 0.45;
    const clampedBaseSpeed = Math.min(baseSpeedRef.current, 52);

    // Controls input combination (Keys + Touch Buttons)
    const isMovingLeft = keysRef.current.left || touchSteerInput.left;
    const isMovingRight = keysRef.current.right || touchSteerInput.right;
    const isBoosting = (keysRef.current.boost || touchSteerInput.boost) && player.nitro > 0;
    const isBraking = keysRef.current.brake || touchSteerInput.brake;

    player.isBoosting = isBoosting;
    player.isBraking = isBraking;

    // Speed calculation
    let currentSpeed = clampedBaseSpeed;
    if (isBoosting) {
      currentSpeed *= 1.45;
      player.nitro = Math.max(0, player.nitro - selectedCar.nitroDrainRate * 45 * dt);
      screenShakeRef.current = Math.max(screenShakeRef.current, 6);
      if (Math.random() < 0.6) {
        sounds.playNitro();
      }
    } else {
      // Natural slow nitro regeneration
      player.nitro = Math.min(selectedCar.nitroCapacity, player.nitro + dt * 4);
    }

    if (isBraking) {
      currentSpeed *= 0.65;
    }

    gameSpeedRef.current = currentSpeed;
    const kmh = Math.round(currentSpeed * 4.8);
    currentKmhRef.current = kmh;
    setSpeedKmh(kmh);
    setNitro(Math.round(player.nitro));

    if (kmh > maxSpeedRecordRef.current) {
      maxSpeedRecordRef.current = kmh;
    }

    // Distance update
    distanceRef.current += (currentSpeed * dt * 2.5);

    // Audio engine pitch
    const speedNorm = (currentSpeed - 20) / 45;
    sounds.updateEngine(Math.max(0, Math.min(1, speedNorm)), isBoosting);

    // Steering logic
    const steerSpeed = selectedCar.handling * 26 * dt;

    if (controlMode === 'TOUCH_DRAG' && touchDragX.current !== null) {
      const target = touchDragX.current - player.width / 2;
      const diff = target - player.x;
      player.x += diff * 0.18;
      player.tilt = Math.max(-0.25, Math.min(0.25, diff * 0.003));
      if (Math.abs(diff) > 40 && Math.random() < 0.1) {
        sounds.playScreech();
      }
    } else {
      if (isMovingLeft) {
        player.vx = -steerSpeed;
        player.tilt = Math.max(player.tilt - 0.04, -0.22);
        if (Math.random() < 0.08) sounds.playScreech();
      } else if (isMovingRight) {
        player.vx = steerSpeed;
        player.tilt = Math.min(player.tilt + 0.04, 0.22);
        if (Math.random() < 0.08) sounds.playScreech();
      } else {
        player.vx *= 0.82;
        player.tilt *= 0.84;
      }
      player.x += player.vx;
    }

    // Road boundaries clamping with rumble strip recoil
    const minX = ROAD_LEFT - 30;
    const maxX = ROAD_RIGHT - player.width + 30;
    if (player.x < minX) {
      player.x = minX;
      player.vx = 0;
      screenShakeRef.current = 4;
      createParticles(player.x, player.y + player.height / 2, 3, '#f59e0b', 'SPARK');
    } else if (player.x > maxX) {
      player.x = maxX;
      player.vx = 0;
      screenShakeRef.current = 4;
      createParticles(player.x + player.width, player.y + player.height / 2, 3, '#f59e0b', 'SPARK');
    }

    // Road scrolling
    roadScrollY.current = (roadScrollY.current + currentSpeed * 1.5) % 240;

    // Timers
    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (player.magnetTimer > 0) player.magnetTimer -= dt;

    // Shake dampening
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 25);
    }

    // Roadside scenery update
    sceneriesRef.current.forEach((item) => {
      item.y += currentSpeed * 1.2;
      if (item.y > V_HEIGHT + 200) {
        item.y = -200;
        item.side = Math.random() < 0.5 ? 'left' : 'right';
      }
    });

    // Spawn traffic
    if (Math.random() < 0.038) {
      spawnEnemy();
    }

    // Spawn pickups
    if (Math.random() < 0.02) {
      spawnPickup();
    }

    // Player exhaust & tire skid particles
    if (Math.random() < 0.85) {
      const leftExhaustX = player.x + 55;
      const rightExhaustX = player.x + player.width - 55;
      const exhaustY = player.y + player.height;

      if (isBoosting) {
        createParticles(leftExhaustX, exhaustY, 2, '#38bdf8', 'FIRE', 0.8);
        createParticles(rightExhaustX, exhaustY, 2, '#06b6d4', 'FIRE', 0.8);
      } else {
        createParticles(leftExhaustX, exhaustY, 1, 'rgba(255,255,255,0.4)', 'SMOKE', 0.4);
        createParticles(rightExhaustX, exhaustY, 1, 'rgba(255,255,255,0.4)', 'SMOKE', 0.4);
      }
    }

    // Update enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      enemy.y += currentSpeed - enemy.speed;

      // Police flashing lights
      if (enemy.type === 'POLICE') {
        enemy.sirenState = ((enemy.sirenState || 0) + dt * 10) % 2;
      }

      // Check Near Miss (Close Call bonus)
      if (
        !enemy.hasPassed &&
        enemy.y > player.y - 100 &&
        enemy.y < player.y + player.height &&
        Math.abs(enemy.x - player.x) < player.width + 120 &&
        Math.abs(enemy.x - player.x) > player.width - 40
      ) {
        enemy.hasPassed = true;
        closeCallsRef.current += 1;
        setMultiplier((prev) => Math.min(prev + 0.5, 5));
        setScore((prev) => prev + 50 * multiplier);
        addFloatText('+50 CLOSE CALL!', enemy.x, enemy.y, '#38bdf8');
        sounds.playNearMiss();
        createParticles((player.x + enemy.x) / 2, player.y + 100, 10, '#38bdf8', 'SPARK');
      }

      // Collision check
      if (player.invulnerableTimer <= 0 && checkAABB(
        player.x,
        player.y,
        player.width,
        player.height,
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height
      )) {
        if (player.hasShield) {
          // Shield absorbs crash!
          player.hasShield = false;
          setHasShield(false);
          player.invulnerableTimer = 1.8;
          screenShakeRef.current = 18;
          sounds.playShieldBreak();
          createParticles(player.x + player.width / 2, player.y + 100, 35, '#38bdf8', 'DEBRIS', 1.8);
          addFloatText('SHIELD SAVED YOU!', player.x, player.y - 80, '#38bdf8');
          // Knock away enemy
          enemy.y += 400;
        } else {
          // Fatal Crash!
          handleCrash(enemy);
          return;
        }
      }

      // Despawn passed enemies & award score
      if (enemy.y > V_HEIGHT + 300) {
        enemiesRef.current.splice(i, 1);
        setScore((prev) => prev + 15 * multiplier);
      }
    }

    // Update pickups
    for (let i = pickupsRef.current.length - 1; i >= 0; i--) {
      const p = pickupsRef.current[i];
      p.y += currentSpeed * 0.95;
      p.rotation += dt * 4;

      // Magnet attraction
      if (player.magnetTimer > 0 && p.type === 'COIN') {
        const dx = (player.x + player.width / 2) - p.x;
        const dy = (player.y + player.height / 2) - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1200) {
          p.x += (dx / dist) * 35;
          p.y += (dy / dist) * 35;
        }
      }

      // Collect pickup
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      const dist = Math.hypot(p.x - playerCenterX, p.y - playerCenterY);

      if (dist < p.radius + player.width * 0.45) {
        if (p.type === 'COIN') {
          const coinValue = selectedCar.id === 'golden_beast' ? 50 : 25;
          setCoins((c) => c + 1);
          setScore((s) => s + coinValue * multiplier);
          sounds.playCoin();
          addFloatText(`+${coinValue}`, p.x, p.y, '#facc15');
          createParticles(p.x, p.y, 16, '#facc15', 'COIN_POP');
        } else if (p.type === 'NITRO') {
          player.nitro = selectedCar.nitroCapacity;
          setNitro(selectedCar.nitroCapacity);
          sounds.playNitro();
          addFloatText('NITRO FULL!', p.x, p.y, '#06b6d4');
          createParticles(p.x, p.y, 20, '#06b6d4', 'FIRE');
        } else if (p.type === 'SHIELD') {
          player.hasShield = true;
          setHasShield(true);
          sounds.playShieldPickup();
          addFloatText('SHIELD ACTIVATED!', p.x, p.y, '#38bdf8');
          createParticles(p.x, p.y, 25, '#38bdf8', 'SPARK');
        } else if (p.type === 'MAGNET') {
          player.magnetTimer = 10;
          sounds.playShieldPickup();
          addFloatText('MAGNET (10s)!', p.x, p.y, '#a855f7');
          createParticles(p.x, p.y, 20, '#a855f7', 'SPARK');
        }

        pickupsRef.current.splice(i, 1);
        continue;
      }

      if (p.y > V_HEIGHT + 200) {
        pickupsRef.current.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += dt * 30;
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatTextsRef.current[i];
      ft.y -= dt * 90;
      ft.life += dt;
      ft.opacity = Math.max(0, 1 - ft.life / 1.2);
      if (ft.life >= 1.2) {
        floatTextsRef.current.splice(i, 1);
      }
    }
  };

  const handleCrash = (enemy: EnemyCar) => {
    const player = playerRef.current;
    screenShakeRef.current = 35;
    sounds.playCrash();
    sounds.stopEngine();

    // Spawn massive explosion
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 80, '#ef4444', 'FIRE', 2.5);
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 60, '#f97316', 'DEBRIS', 2);
    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 40, '#facc15', 'SPARK', 1.8);

    setGameState('GAME_OVER');
    onGameOver(
      score,
      coins,
      Math.round(distanceRef.current),
      maxSpeedRecordRef.current,
      closeCallsRef.current
    );
  };

  // Rendering
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Scale canvas if internal resolution is configured differently
    const resConfig = RESOLUTIONS[resolution];
    const scaleFactor = resConfig.width / V_WIDTH;
    ctx.scale(scaleFactor, scaleFactor);

    // Apply Screen Shake
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 4;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 4;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Roadside Off-Road Grass & Horizon
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Left Grass Shoulder
    const grassGradL = ctx.createLinearGradient(0, 0, ROAD_LEFT, 0);
    grassGradL.addColorStop(0, '#042f1a');
    grassGradL.addColorStop(1, '#064e3b');
    ctx.fillStyle = grassGradL;
    ctx.fillRect(0, 0, ROAD_LEFT, V_HEIGHT);

    // Right Grass Shoulder
    const grassGradR = ctx.createLinearGradient(ROAD_RIGHT, 0, V_WIDTH, 0);
    grassGradR.addColorStop(0, '#064e3b');
    grassGradR.addColorStop(1, '#042f1a');
    ctx.fillStyle = grassGradR;
    ctx.fillRect(ROAD_RIGHT, 0, V_WIDTH - ROAD_RIGHT, V_HEIGHT);

    // 2. Draw Road Asphalt Surface with subtle asphalt gradient
    const asphaltGrad = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_RIGHT, 0);
    asphaltGrad.addColorStop(0, '#18181b');
    asphaltGrad.addColorStop(0.5, '#27272a');
    asphaltGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = asphaltGrad;
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, V_HEIGHT);

    // 3. Draw Curbs / Rumble Strips (Red and White alternating blocks)
    const curbWidth = 35;
    const curbSegmentH = 120;
    const curbOffset = (roadScrollY.current * 1.5) % (curbSegmentH * 2);

    for (let y = -curbSegmentH * 2 + curbOffset; y < V_HEIGHT + curbSegmentH; y += curbSegmentH) {
      const isRed = Math.floor((y - curbOffset) / curbSegmentH) % 2 === 0;
      ctx.fillStyle = isRed ? '#dc2626' : '#f8fafc';

      // Left curb
      ctx.fillRect(ROAD_LEFT - curbWidth, y, curbWidth, curbSegmentH);
      // Right curb
      ctx.fillRect(ROAD_RIGHT, y, curbWidth, curbSegmentH);
    }

    // Outer Solid White Road Edge Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ROAD_LEFT, 0);
    ctx.lineTo(ROAD_LEFT, V_HEIGHT);
    ctx.moveTo(ROAD_RIGHT, 0);
    ctx.lineTo(ROAD_RIGHT, V_HEIGHT);
    ctx.stroke();

    // 4. Inner Lane Markings (Dashed Lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.setLineDash([120, 120]);
    ctx.lineDashOffset = -roadScrollY.current * 2;

    for (let i = 1; i < LANES_COUNT; i++) {
      const laneX = ROAD_LEFT + i * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, V_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 5. Draw Roadside Scenery (Lamps, Palm Trees, Billboards)
    sceneriesRef.current.forEach((item) => {
      const isLeft = item.side === 'left';
      const x = isLeft ? ROAD_LEFT - 120 : ROAD_RIGHT + 120;

      if (item.type === 'LAMP') {
        // High-tech Street Lamp
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 8, item.y, 16, 80);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, item.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Light cone casting onto road
        const coneGrad = ctx.createRadialGradient(x, item.y, 10, x, item.y, 220);
        coneGrad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
        coneGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.arc(x, item.y, 220, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'TREE') {
        // Palm Tree / Bush
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 12, item.y, 24, 60);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(x, item.y - 15, 45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Digital Billboard
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - (isLeft ? 70 : 10), item.y, 80, 50);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - (isLeft ? 70 : 10), item.y, 80, 50);
      }
    });

    // 6. Draw Skid Marks
    skidMarksRef.current.forEach((skid) => {
      ctx.strokeStyle = `rgba(10, 10, 12, ${skid.alpha})`;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(skid.x1, skid.y1);
      ctx.lineTo(skid.x2, skid.y2);
      ctx.stroke();
    });

    // 7. Draw Pickups (Coins, Nitro, Shield, Magnet)
    pickupsRef.current.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'COIN') {
        // 3D Shiny Rotating Coin
        const coinW = Math.abs(Math.cos(p.rotation)) * p.radius;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(8, coinW), p.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
      } else if (p.type === 'NITRO') {
        // Glowing Nitro Cylinder
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#0891b2';
        ctx.roundRect(-30, -50, 60, 100, 16);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-15, -60, 30, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N₂O', 0, 0);
      } else if (p.type === 'SHIELD') {
        // Shimmering Forcefield Orb
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 35;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 2);
      } else if (p.type === 'MAGNET') {
        // Purple Magnetic Orb
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 35;
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', 0, 2);
      }

      ctx.restore();
    });

    // 8. Draw Enemy Cars
    enemiesRef.current.forEach((enemy) => {
      drawVehicle(ctx, enemy.x, enemy.y, enemy.width, enemy.height, enemy.color, enemy.roofColor, enemy.type, false, 0, enemy.sirenState);
    });

    // 9. Draw Player Car
    const player = playerRef.current;
    const isInvulnerable = player.invulnerableTimer > 0;
    const shouldDrawPlayer = !isInvulnerable || Math.floor(player.invulnerableTimer * 12) % 2 === 0;

    if (shouldDrawPlayer) {
      // Draw Headlight Beams Casting Ahead
      ctx.save();
      const beamGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y - 700);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;

      // Left beam
      ctx.beginPath();
      ctx.moveTo(player.x + 40, player.y + 10);
      ctx.lineTo(player.x - 120, player.y - 650);
      ctx.lineTo(player.x + 120, player.y - 650);
      ctx.closePath();
      ctx.fill();

      // Right beam
      ctx.beginPath();
      ctx.moveTo(player.x + player.width - 40, player.y + 10);
      ctx.lineTo(player.x + player.width - 120, player.y - 650);
      ctx.lineTo(player.x + player.width + 120, player.y - 650);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Player Car Body
      drawVehicle(
        ctx,
        player.x,
        player.y,
        player.width,
        player.height,
        player.color,
        player.secondaryColor,
        'SUPERCAR',
        true,
        player.tilt,
        0,
        player.glowColor
      );

      // Draw Shield Aura if active
      if (player.hasShield) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 45;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 14;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.beginPath();
        ctx.ellipse(
          player.x + player.width / 2,
          player.y + player.height / 2,
          player.width * 0.75,
          player.height * 0.62,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 10. Draw Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'FIRE') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'SMOKE') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'DEBRIS') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        // Spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 11. Draw Floating Score / Bonus Texts
    floatTextsRef.current.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.opacity;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 15;
      ctx.font = `800 ${ft.size}px 'Barlow Condensed', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 12. Speed Lines when boosting or top speed
    if (player.isBoosting || gameSpeedRef.current > 42) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 18; i++) {
        const lineX = ROAD_LEFT + Math.random() * ROAD_WIDTH;
        const lineY = Math.random() * V_HEIGHT;
        const len = 120 + Math.random() * 240;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX, lineY + len);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  // High-fidelity Vector Car Drawer (Works crisp at native 4K)
  const drawVehicle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    primaryColor: string,
    secondaryColor: string,
    type: EnemyType,
    isPlayer = false,
    tilt = 0,
    sirenState = 0,
    glowColor = '#3b82f6'
  ) => {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (tilt !== 0) {
      ctx.rotate(tilt);
    }

    const halfW = w / 2;
    const halfH = h / 2;

    // Ambient shadow under car
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(-halfW - 15, -halfH + 10, w + 30, h, 30);
    ctx.fill();

    // 4 Wheels / Tires (extending outside chassis)
    ctx.fillStyle = '#09090b';
    const wheelW = 48;
    const wheelH = 100;
    // Front wheels
    ctx.roundRect(-halfW - 12, -halfH + 60, wheelW, wheelH, 12);
    ctx.roundRect(halfW - wheelW + 12, -halfH + 60, wheelW, wheelH, 12);
    // Rear wheels
    ctx.roundRect(-halfW - 12, halfH - 160, wheelW, wheelH, 12);
    ctx.roundRect(halfW - wheelW + 12, halfH - 160, wheelW, wheelH, 12);
    ctx.fill();

    // Main Chassis Body
    ctx.fillStyle = primaryColor;
    if (isPlayer) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 25;
    }
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, w, h, 40);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    if (type === 'TRUCK') {
      // 18-Wheeler Cargo Container Body
      ctx.fillStyle = secondaryColor;
      ctx.roundRect(-halfW + 20, -halfH + 180, w - 40, h - 220, 16);
      ctx.fill();

      // Front Cabin
      ctx.fillStyle = primaryColor;
      ctx.roundRect(-halfW + 10, -halfH, w - 20, 160, 24);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW + 30, -halfH + 30, w - 60, 50);

      // Marker lights
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-halfW + 20, -halfH + 10, 25, 12);
      ctx.fillRect(halfW - 45, -halfH + 10, 25, 12);
      ctx.restore();
      return;
    }

    // Racing Stripes for sports car / player
    if (isPlayer) {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-25, -halfH, 20, h);
      ctx.fillRect(5, -halfH, 20, h);
    }

    // Hood scoop / vents
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(-halfW + 60, -halfH + 60, w - 120, 35, 10);
    ctx.fill();

    // Windshield (Front Cockpit Glass)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-halfW + 35, -halfH + 130);
    ctx.lineTo(halfW - 35, -halfH + 130);
    ctx.lineTo(halfW - 45, -halfH + 240);
    ctx.lineTo(-halfW + 45, -halfH + 240);
    ctx.closePath();
    ctx.fill();

    // Glass Reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(-halfW + 55, -halfH + 140);
    ctx.lineTo(-halfW + 115, -halfH + 140);
    ctx.lineTo(-halfW + 90, -halfH + 230);
    ctx.lineTo(-halfW + 50, -halfH + 230);
    ctx.closePath();
    ctx.fill();

    // Roof Top
    ctx.fillStyle = secondaryColor || '#020617';
    ctx.beginPath();
    ctx.roundRect(-halfW + 42, -halfH + 240, w - 84, 110, 16);
    ctx.fill();

    // Rear Window Glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-halfW + 45, -halfH + 355);
    ctx.lineTo(halfW - 45, -halfH + 355);
    ctx.lineTo(halfW - 35, -halfH + 425);
    ctx.lineTo(-halfW + 35, -halfH + 425);
    ctx.closePath();
    ctx.fill();

    // Rear Spoiler
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-halfW + 20, halfH - 35, w - 40, 25);

    // Front Headlights (Neon yellow/white)
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 15;
    ctx.fillRect(-halfW + 20, -halfH + 8, 55, 25);
    ctx.fillRect(halfW - 75, -halfH + 8, 55, 25);

    // Rear Taillights (Red glow)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.fillRect(-halfW + 25, halfH - 18, 50, 16);
    ctx.fillRect(halfW - 75, halfH - 18, 50, 16);
    ctx.shadowBlur = 0;

    // Police Emergency Lightbar
    if (type === 'POLICE') {
      const isRed = Math.floor(sirenState) === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
      ctx.shadowColor = isRed ? '#ef4444' : '#3b82f6';
      ctx.shadowBlur = 25;
      ctx.fillRect(-50, -halfH + 270, 100, 28);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  const currentRes = RESOLUTIONS[resolution];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={currentRes.width}
        height={currentRes.height}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full object-contain max-h-[100dvh] transition-all duration-300 drop-shadow-2xl select-none"
        style={{
          aspectRatio: '9 / 16',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
