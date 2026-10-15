import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Gauge, Flame, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  coins: number;
  distance: number;
  maxSpeed: number;
  closeCalls: number;
  onRestart: () => void;
  onGoToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewHighScore,
  coins,
  distance,
  maxSpeed,
  closeCalls,
  onRestart,
  onGoToMenu,
}) => {
  useEffect(() => {
    if (isNewHighScore && score > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f59e0b', '#38bdf8', '#ffffff'],
        });
      } catch {
        // Fallback gracefully
      }
    }
  }, [isNewHighScore, score]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-md w-full arcade-panel p-6 rounded-3xl border border-red-500/30 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        {/* Crashed Banner */}
        <div className="mb-4">
          <span className="text-xs uppercase font-bold tracking-widest text-red-400 block mb-1">
            Total Impact
          </span>
          <h2 className="text-5xl sm:text-6xl font-black font-arcade italic text-red-500 tracking-wider uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            CRASHED!
          </h2>
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mt-2 animate-bounce">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>NEW ALL-TIME RECORD!</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">High-speed collision detected</p>
          )}
        </div>

        {/* Primary Score Board */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Final Score
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono-numbers text-white mt-0.5">
            {score.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Best Record: <span className="text-amber-400 font-mono-numbers font-bold">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Coins Collected
            </span>
            <span className="text-base sm:text-lg font-bold font-mono-numbers text-amber-300">
              +{coins} 🪙
            </span>
          </div>

          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Max Speed Reached
            </span>
            <span className="text-base sm:text-lg font-bold font-mono-numbers text-cyan-400">
              {maxSpeed} KM/H
            </span>
          </div>

          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Distance Covered
            </span>
            <span className="text-base sm:text-lg font-bold font-mono-numbers text-emerald-400">
              {(distance / 10).toFixed(0)} m
            </span>
          </div>

          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Close Calls
            </span>
            <span className="text-base sm:text-lg font-bold font-mono-numbers text-sky-400">
              {closeCalls}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xl font-arcade uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-[0.98] transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            RACE AGAIN
          </button>

          <button
            type="button"
            onClick={onGoToMenu}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            Return to Garage
          </button>
        </div>
      </div>
    </div>
  );
};
