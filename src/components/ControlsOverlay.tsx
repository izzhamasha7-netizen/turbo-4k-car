import React from 'react';
import { ArrowLeft, ArrowRight, Zap, ShieldAlert } from 'lucide-react';

interface ControlsOverlayProps {
  controlMode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT';
  onInputStart: (action: 'left' | 'right' | 'boost' | 'brake') => void;
  onInputEnd: (action: 'left' | 'right' | 'boost' | 'brake') => void;
  nitroPercent: number;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  controlMode,
  onInputStart,
  onInputEnd,
  nitroPercent,
}) => {
  if (controlMode === 'TOUCH_DRAG') {
    return (
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
        <div className="arcade-panel px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-slate-300">
          Touch & Drag anywhere to steer car
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 z-20 pointer-events-none flex items-end justify-between select-none">
      {/* Left Steering Cluster: Left and Right Turn Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Left Button */}
        <button
          type="button"
          aria-label="Steer Left"
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('left');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('left');
          }}
          onMouseDown={() => onInputStart('left')}
          onMouseUp={() => onInputEnd('left')}
          onMouseLeave={() => onInputEnd('left')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center shadow-2xl active:bg-white/30 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </button>

        {/* Right Button */}
        <button
          type="button"
          aria-label="Steer Right"
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('right');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('right');
          }}
          onMouseDown={() => onInputStart('right')}
          onMouseUp={() => onInputEnd('right')}
          onMouseLeave={() => onInputEnd('right')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center shadow-2xl active:bg-white/30 active:scale-95 transition-transform"
        >
          <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </button>
      </div>

      {/* Right Action Cluster: Brake & Nitro Boost Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Brake Button */}
        <button
          type="button"
          aria-label="Brake"
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('brake');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('brake');
          }}
          onMouseDown={() => onInputStart('brake')}
          onMouseUp={() => onInputEnd('brake')}
          onMouseLeave={() => onInputEnd('brake')}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-red-500/50 text-red-400 flex flex-col items-center justify-center shadow-2xl active:bg-red-500/30 active:scale-95 transition-transform"
        >
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Brake</span>
        </button>

        {/* Nitro Boost Button */}
        <button
          type="button"
          aria-label="Nitro Boost"
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('boost');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('boost');
          }}
          onMouseDown={() => onInputStart('boost')}
          onMouseUp={() => onInputEnd('boost')}
          onMouseLeave={() => onInputEnd('boost')}
          disabled={nitroPercent <= 5}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform ${
            nitroPercent > 5
              ? 'bg-gradient-to-tr from-cyan-600 to-sky-400 border-2 border-cyan-200 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse'
              : 'bg-slate-800/80 border-2 border-white/20 text-slate-500 opacity-60'
          }`}
        >
          <Zap className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-wider">Nitro</span>
        </button>
      </div>
    </div>
  );
};
