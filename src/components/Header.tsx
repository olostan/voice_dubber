import React from 'react';
import { Film, Sparkles, Plus, RotateCcw, Mic } from 'lucide-react';

interface HeaderProps {
  onOpenAiJudge: () => void;
  onOpenExport: () => void;
  hasTakes: boolean;
  hasVideoLoaded?: boolean;
  onResetClip?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAiJudge,
  onOpenExport,
  hasTakes,
  hasVideoLoaded = false,
  onResetClip,
}) => {
  return (
    <header id="app-header" className="border-b border-zinc-800/80 bg-[#121215]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 text-white font-black text-xl">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-zinc-100 font-['Outfit'] tracking-tight">
                  Voice <span className="text-orange-400">Dubber</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  Dub Studio
                </span>
              </div>
              <p className="text-xs text-zinc-400">Tab Capture & Multi-Voice Track Dubbing</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          {/* New Dub Button */}
          {hasVideoLoaded && onResetClip && (
            <button
              id="new-dub-btn"
              onClick={onResetClip}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all"
              title="Start a new dub with a new tab capture or video clip"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>New Dub</span>
            </button>
          )}

          {/* AI Judge Button */}
          {hasTakes && (
            <button
              id="ai-judge-trigger-btn"
              onClick={onOpenAiJudge}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-950/50 border border-orange-400/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>AI Judge</span>
            </button>
          )}

          {/* Export Video Button */}
          <button
            id="export-video-btn"
            onClick={onOpenExport}
            disabled={!hasTakes}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hasTakes
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950/50 border border-orange-400/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Export Dub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
