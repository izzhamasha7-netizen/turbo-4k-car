import React from 'react';
import { Volume2, VolumeX, Pause, Play, Shield, Zap, Sparkles } from 'lucide-react';

interface HUDProps {
  score: number;
  coins: number;
  nitro: number;
  maxNitro: number;
  speedKmh: number;
  hasShield: boolean;
  multiplier: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  coins,
  nitro,
  maxNitro,
  speedKmh,
  hasShield,
  multiplier,
  soundEnabled,
  onToggleSound,
  isPaused,
  onTogglePause,
}) => {
  const nitroPercent = Math.min(100, Math.max(0, (nitro / maxNitro) * 100));

  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 pointer-events-none flex flex-col gap-2">
      {/* Top Bar Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Score & Multiplier */}
        <div className="flex items-center gap-3 arcade-panel px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
              Score
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono-numbers text-white leading-none">
              {score.toLocaleString()}
            </span>
          </div>

          {multiplier > 1 && (
            <div className="flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono-numbers">
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
              <span>{multiplier}x</span>
            </div>
          )}
        </div>

        {/* Coins & Shield Indicators */}
        <div className="flex items-center gap-2">
          {hasShield && (
            <div className="arcade-panel px-2.5 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 text-cyan-400 shadow-md">
              <Shield className="w-4 h-4 fill-cyan-400 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold font-arcade tracking-wide uppercase">Shield</span>
            </div>
          )}

          <div className="arcade-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-amber-400 shadow-lg">
            <span className="text-base leading-none">🪙</span>
            <span className="text-base sm:text-lg font-bold font-mono-numbers text-amber-300">
              {coins}
            </span>
          </div>

          {/* Action buttons (Sound & Pause) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleSound}
              aria-label="Toggle Sound"
              className="w-9 h-9 rounded-xl arcade-panel flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onTogglePause}
              aria-label="Pause Game"
              className="w-9 h-9 rounded-xl arcade-panel flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Speedometer & Nitro Gauges Row */}
      <div className="flex items-center justify-between gap-3 px-1">
        {/* Speedometer */}
        <div className="flex items-baseline gap-1 arcade-panel px-3 py-1 rounded-lg border border-white/10">
          <span className="text-2xl sm:text-3xl font-black font-arcade tracking-tight text-white font-mono-numbers">
            {speedKmh}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            KM/H
          </span>
        </div>

        {/* Nitro Plasma Gauge */}
        <div className="arcade-panel px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 flex-1 max-w-[200px] sm:max-w-[240px]">
          <Zap className={`w-4 h-4 ${nitroPercent > 20 ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`} />
          <div className="flex-1 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                nitroPercent > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'bg-gradient-to-r from-amber-500 to-red-500'
              }`}
              style={{ width: `${nitroPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold font-mono-numbers text-cyan-300 w-7 text-right">
            {Math.round(nitroPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
};
