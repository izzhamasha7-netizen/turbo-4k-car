/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { StartMenu } from './components/StartMenu';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { CAR_MODELS } from './data/cars';
import { CarModel, GameState, GameStats, ResolutionPreset, RESOLUTIONS } from './types/game';
import { sounds } from './utils/sound';
import {
  Gamepad2,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Flame,
} from 'lucide-react';

const STATS_STORAGE_KEY = 'turbo_4k_racer_stats_v1';
const SETTINGS_STORAGE_KEY = 'turbo_4k_racer_settings_v1';

export default function App() {
  // Game states
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedCar, setSelectedCar] = useState<CarModel>(CAR_MODELS[0]);
  const [resolution, setResolution] = useState<ResolutionPreset>('4K');
  const [controlMode, setControlMode] = useState<'BUTTONS' | 'TOUCH_DRAG' | 'TILT'>('BUTTONS');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);

  // Runtime live metrics
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [nitro, setNitro] = useState<number>(100);
  const [speedKmh, setSpeedKmh] = useState<number>(120);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Game over report payload
  const [lastRunStats, setLastRunStats] = useState<{
    distance: number;
    maxSpeed: number;
    closeCalls: number;
  }>({
    distance: 0,
    maxSpeed: 0,
    closeCalls: 0,
  });

  // Persistent stats
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      highScore: 0,
      totalCoins: 0,
      gamesPlayed: 0,
      totalDistance: 0,
      maxSpeed: 0,
      closeCallsTotal: 0,
    };
  });

  // Touch button states
  const [touchSteerInput, setTouchSteerInput] = useState<{
    left: boolean;
    right: boolean;
    boost: boolean;
    brake: boolean;
  }>({
    left: false,
    right: false,
    boost: false,
    brake: false,
  });

  // Load saved settings
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.musicEnabled !== undefined) setMusicEnabled(parsed.musicEnabled);
        if (parsed.resolution) setResolution(parsed.resolution);
        if (parsed.controlMode) setControlMode(parsed.controlMode);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save settings when changed
  const updateSettings = useCallback(
    (key: string, value: unknown) => {
      try {
        const current = {
          soundEnabled,
          musicEnabled,
          resolution,
          controlMode,
          [key]: value,
        };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(current));
      } catch {
        // Ignore
      }
    },
    [soundEnabled, musicEnabled, resolution, controlMode]
  );

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setSoundEnabled(next);
    sounds.playClick();
    updateSettings('soundEnabled', next);
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    sounds.setMusicEnabled(next);
    sounds.playClick();
    updateSettings('musicEnabled', next);
  };

  const handleChangeResolution = (res: ResolutionPreset) => {
    setResolution(res);
    sounds.playClick();
    updateSettings('resolution', res);
  };

  const handleChangeControlMode = (mode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT') => {
    setControlMode(mode);
    sounds.playClick();
    updateSettings('controlMode', mode);
  };

  // Touch control callbacks
  const handleTouchInputStart = (action: 'left' | 'right' | 'boost' | 'brake') => {
    setTouchSteerInput((prev) => ({ ...prev, [action]: true }));
  };

  const handleTouchInputEnd = (action: 'left' | 'right' | 'boost' | 'brake') => {
    setTouchSteerInput((prev) => ({ ...prev, [action]: false }));
  };

  // Game start
  const handleStartGame = () => {
    sounds.playClick();
    setIsNewHighScore(false);
    setGameState('PLAYING');
  };

  // Game over event
  const handleGameOver = (
    finalScore: number,
    finalCoins: number,
    distance: number,
    maxSpeedReached: number,
    closeCalls: number
  ) => {
    setLastRunStats({
      distance,
      maxSpeed: maxSpeedReached,
      closeCalls,
    });

    const isNewBest = finalScore > stats.highScore;
    setIsNewHighScore(isNewBest);

    const updatedStats: GameStats = {
      highScore: Math.max(stats.highScore, finalScore),
      totalCoins: stats.totalCoins + finalCoins,
      gamesPlayed: stats.gamesPlayed + 1,
      totalDistance: stats.totalDistance + distance,
      maxSpeed: Math.max(stats.maxSpeed, maxSpeedReached),
      closeCallsTotal: stats.closeCallsTotal + closeCalls,
    };

    setStats(updatedStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));
    } catch {
      // Ignore
    }
  };

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 md:p-4 select-none overflow-hidden relative">
      {/* Background ambient neon glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container: Mobile phone viewport on desktop; direct full viewport on phone */}
      <div className="w-full h-screen max-w-full md:max-w-6xl flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
        {/* Desktop Side Info Panel (Hidden on mobile phones) */}
        <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          <div className="arcade-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-red-500 font-arcade text-2xl font-black italic tracking-wide">
              <Flame className="w-6 h-6 text-red-500 animate-pulse" />
              <span>4K MOBILE RACER</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ultra-sharp 4K native canvas rendering with mobile touch controls and responsive keyboard physics.
            </p>
          </div>

          {/* Active Vehicle Card */}
          <div className="arcade-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Vehicle
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: selectedCar.color }}
              />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{selectedCar.name}</h3>
              <p className="text-xs text-slate-400">{selectedCar.tagline}</p>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 pt-1">
              <div className="flex justify-between">
                <span>Top Speed</span>
                <span className="font-mono-numbers text-cyan-400 font-bold">{selectedCar.topSpeed * 4.8} km/h</span>
              </div>
              <div className="flex justify-between">
                <span>Handling</span>
                <span className="font-mono-numbers text-emerald-400 font-bold">{selectedCar.handling} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Perk</span>
                <span className="text-amber-400 text-[11px] font-semibold truncate max-w-[140px]">{selectedCar.special}</span>
              </div>
            </div>
          </div>

          {/* Records & Stats */}
          <div className="arcade-panel p-4 rounded-2xl border border-white/10 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Hall of Fame
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Personal Best</span>
                <span className="font-mono-numbers font-bold text-amber-300">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Total Coins</span>
                <span className="font-mono-numbers font-bold text-amber-400">
                  {stats.totalCoins} 🪙
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Races Finished</span>
                <span className="font-mono-numbers text-slate-300">
                  {stats.gamesPlayed}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Record Speed</span>
                <span className="font-mono-numbers font-bold text-cyan-400">
                  {stats.maxSpeed} km/h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The Mobile Phone Gaming Viewport Frame */}
        <div className="relative w-full h-full md:h-[94vh] md:max-w-[480px] bg-slate-900 md:rounded-3xl md:border-4 md:border-slate-800 md:shadow-2xl overflow-hidden flex flex-col justify-center items-center">
          {/* Top Speaker / Camera Notch Mock on Desktop */}
          <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-40 border border-white/5 pointer-events-none" />

          {/* HUD Overlay */}
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <HUD
              score={score}
              coins={coins}
              nitro={nitro}
              maxNitro={selectedCar.nitroCapacity}
              speedKmh={speedKmh}
              hasShield={hasShield}
              multiplier={multiplier}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              isPaused={gameState === 'PAUSED'}
              onTogglePause={() => setGameState(gameState === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
            />
          )}

          {/* 4K Canvas Game View */}
          <GameCanvas
            gameState={gameState}
            setGameState={setGameState}
            selectedCar={selectedCar}
            resolution={resolution}
            controlMode={controlMode}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            score={score}
            setScore={setScore}
            coins={coins}
            setCoins={setCoins}
            nitro={nitro}
            setNitro={setNitro}
            speedKmh={speedKmh}
            setSpeedKmh={setSpeedKmh}
            hasShield={hasShield}
            setHasShield={setHasShield}
            multiplier={multiplier}
            setMultiplier={setMultiplier}
            onGameOver={handleGameOver}
            isPaused={gameState === 'PAUSED'}
            touchSteerInput={touchSteerInput}
          />

          {/* Mobile Touch Controls Overlay */}
          {gameState === 'PLAYING' && (
            <ControlsOverlay
              controlMode={controlMode}
              onInputStart={handleTouchInputStart}
              onInputEnd={handleTouchInputEnd}
              nitroPercent={(nitro / selectedCar.nitroCapacity) * 100}
            />
          )}

          {/* Menus & Modals */}
          {gameState === 'MENU' && (
            <StartMenu
              selectedCar={selectedCar}
              onSelectCar={setSelectedCar}
              onStartGame={handleStartGame}
              stats={stats}
              resolution={resolution}
              onChangeResolution={handleChangeResolution}
              controlMode={controlMode}
              onChangeControlMode={handleChangeControlMode}
            />
          )}

          {gameState === 'PAUSED' && (
            <PauseModal
              onResume={() => setGameState('PLAYING')}
              onRestart={() => {
                setGameState('PLAYING');
              }}
              onGoToMenu={() => setGameState('MENU')}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              musicEnabled={musicEnabled}
              onToggleMusic={handleToggleMusic}
              resolution={resolution}
              onChangeResolution={handleChangeResolution}
              controlMode={controlMode}
              onChangeControlMode={handleChangeControlMode}
            />
          )}

          {gameState === 'GAME_OVER' && (
            <GameOverModal
              score={score}
              highScore={stats.highScore}
              isNewHighScore={isNewHighScore}
              coins={coins}
              distance={lastRunStats.distance}
              maxSpeed={lastRunStats.maxSpeed}
              closeCalls={lastRunStats.closeCalls}
              onRestart={() => setGameState('PLAYING')}
              onGoToMenu={() => setGameState('MENU')}
            />
          )}
        </div>

        {/* Desktop Right Side Guide & Controls Panel */}
        <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          {/* Controls Cheatsheet */}
          <div className="arcade-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              Keyboard Controls
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Steer Left / Right</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-mono text-[11px]">
                  A / D or ⬅️ / ➡️
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nitro Boost</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-mono text-[11px]">
                  Space or W / ⬆️
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emergency Brake</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-mono text-[11px]">
                  S or ⬇️
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pause Game</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-mono text-[11px]">
                  P or Esc
                </span>
              </div>
            </div>
          </div>

          {/* Quick Resolution & Audio Switch */}
          <div className="arcade-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Display Engine
              </span>
              <button
                onClick={toggleFullScreen}
                title="Toggle Fullscreen"
                className="text-slate-400 hover:text-white transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-slate-300">
              <div className="font-semibold text-white">
                {RESOLUTIONS[resolution].name}
              </div>
              <div className="text-[11px] text-slate-400">
                {RESOLUTIONS[resolution].label}
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex gap-2">
              <button
                onClick={handleToggleSound}
                className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                <span>{soundEnabled ? 'SFX On' : 'Muted'}</span>
              </button>

              <button
                onClick={handleToggleMusic}
                className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <span>{musicEnabled ? '🎵 Music' : '🔇 Off'}</span>
              </button>
            </div>
          </div>

          {/* Gameplay Tips */}
          <div className="arcade-panel p-4 rounded-2xl border border-white/10 space-y-1.5 text-xs text-slate-400">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Pro Tips
            </span>
            <p>• Weave closely past traffic to trigger <span className="text-cyan-400 font-semibold">Close Call bonuses (+50)</span> and ramp up your multiplier!</p>
            <p>• Watch out for giant 18-wheelers; they require early lane changes.</p>
            <p>• Grab blue <span className="text-sky-300 font-semibold">Shield Orbs</span> to survive a high-speed collision unscathed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
