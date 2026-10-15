import React from 'react';
import { CAR_MODELS } from '../data/cars';
import { CarModel, GameStats, RESOLUTIONS, ResolutionPreset } from '../types/game';
import { Play, Trophy, Gauge, Zap, Flame, Shield, Monitor, Smartphone, Compass } from 'lucide-react';

interface StartMenuProps {
  selectedCar: CarModel;
  onSelectCar: (car: CarModel) => void;
  onStartGame: () => void;
  stats: GameStats;
  resolution: ResolutionPreset;
  onChangeResolution: (res: ResolutionPreset) => void;
  controlMode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT';
  onChangeControlMode: (mode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT') => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  selectedCar,
  onSelectCar,
  onStartGame,
  stats,
  resolution,
  onChangeResolution,
  controlMode,
  onChangeControlMode,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
          <Monitor className="w-3.5 h-3.5" />
          <span>{RESOLUTIONS[resolution].label} Canvas</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-arcade tracking-tight text-white uppercase italic drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]">
          TURBO 4K RACER
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Ultra-HD arcade highway racing. Dodge traffic, collect coins & hit nitro boost.
        </p>
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto w-full my-2">
        <div className="arcade-panel p-2.5 rounded-xl text-center border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Best Score
          </span>
          <span className="text-lg sm:text-xl font-black font-mono-numbers text-amber-400">
            {stats.highScore.toLocaleString()}
          </span>
        </div>

        <div className="arcade-panel p-2.5 rounded-xl text-center border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Top Speed
          </span>
          <span className="text-lg sm:text-xl font-black font-mono-numbers text-cyan-400">
            {stats.maxSpeed} <span className="text-xs">KM/H</span>
          </span>
        </div>

        <div className="arcade-panel p-2.5 rounded-xl text-center border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Coins
          </span>
          <span className="text-lg sm:text-xl font-black font-mono-numbers text-amber-300">
            {stats.totalCoins} 🪙
          </span>
        </div>
      </div>

      {/* Garage / Car Selector */}
      <div className="max-w-md mx-auto w-full my-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            Select Your Vehicle
          </span>
          <span className="text-xs text-slate-400">
            {selectedCar.name}
          </span>
        </div>

        {/* Car Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {CAR_MODELS.map((car) => {
            const isSelected = selectedCar.id === car.id;
            return (
              <button
                key={car.id}
                type="button"
                onClick={() => onSelectCar(car)}
                className={`p-3 rounded-2xl text-left transition-all border relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-sm font-bold text-white leading-tight">{car.name}</span>
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: car.color }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-tight mb-2 line-clamp-1">
                  {car.special}
                </p>

                {/* Micro Stat Bars */}
                <div className="space-y-1 w-full text-[9px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Speed</span>
                    <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(car.topSpeed / 46) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agility</span>
                    <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${(car.handling / 56) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings / Controls configuration */}
      <div className="max-w-md mx-auto w-full my-2 space-y-2">
        <div className="flex items-center justify-between gap-2 p-2 arcade-panel rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Steering:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeControlMode('BUTTONS')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                controlMode === 'BUTTONS'
                  ? 'bg-cyan-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buttons
            </button>
            <button
              onClick={() => onChangeControlMode('TOUCH_DRAG')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                controlMode === 'TOUCH_DRAG'
                  ? 'bg-cyan-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Touch Drag
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 arcade-panel rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>Resolution:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['4K', '1440P', '1080P'] as ResolutionPreset[]).map((res) => (
              <button
                key={res}
                onClick={() => onChangeResolution(res)}
                className={`px-2 py-1 text-xs rounded-lg font-mono-numbers font-medium transition ${
                  resolution === res
                    ? 'bg-white text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button & Controls Hint */}
      <div className="max-w-md mx-auto w-full pt-1 pb-2">
        <button
          type="button"
          onClick={onStartGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xl sm:text-2xl font-arcade uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          START RACE
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          Keyboard: Left / Right (A / D) to steer · Space / Up (W) for Nitro · Down (S) for Brake
        </p>
      </div>
    </div>
  );
};
