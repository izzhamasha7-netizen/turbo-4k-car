import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Monitor, Smartphone } from 'lucide-react';
import { RESOLUTIONS, ResolutionPreset } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGoToMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  resolution: ResolutionPreset;
  onChangeResolution: (res: ResolutionPreset) => void;
  controlMode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT';
  onChangeControlMode: (mode: 'BUTTONS' | 'TOUCH_DRAG' | 'TILT') => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGoToMenu,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  resolution,
  onChangeResolution,
  controlMode,
  onChangeControlMode,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-sm w-full arcade-panel p-6 rounded-3xl border border-white/10 text-center shadow-2xl">
        <h2 className="text-3xl font-black font-arcade italic text-white uppercase tracking-wider mb-4">
          GAME PAUSED
        </h2>

        {/* Settings Toggles */}
        <div className="space-y-2 mb-6 text-left">
          {/* Sound & Music */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleSound}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                soundEnabled
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/50 border-white/5 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>SFX: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onToggleMusic}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                musicEnabled
                  ? 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900/50 border-white/5 text-slate-500'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Music: {musicEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Steering Control */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Steering
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onChangeControlMode('BUTTONS')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                  controlMode === 'BUTTONS' ? 'bg-cyan-500 text-white' : 'text-slate-400'
                }`}
              >
                Buttons
              </button>
              <button
                onClick={() => onChangeControlMode('TOUCH_DRAG')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                  controlMode === 'TOUCH_DRAG' ? 'bg-cyan-500 text-white' : 'text-slate-400'
                }`}
              >
                Drag
              </button>
            </div>
          </div>

          {/* Resolution Selector */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" /> Resolution
            </span>
            <div className="flex gap-1">
              {(['4K', '1440P', '1080P'] as ResolutionPreset[]).map((res) => (
                <button
                  key={res}
                  onClick={() => onChangeResolution(res)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono-numbers font-medium ${
                    resolution === res ? 'bg-white text-slate-900 font-bold' : 'text-slate-400'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Race
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-white/10 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Race
          </button>

          <button
            type="button"
            onClick={onGoToMenu}
            className="w-full py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            Garage / Title Menu
          </button>
        </div>
      </div>
    </div>
  );
};
