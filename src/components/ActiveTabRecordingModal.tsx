import React, { useEffect, useState } from 'react';
import { ScreenShare, StopCircle, Volume2, AlertCircle, Sparkles } from 'lucide-react';

interface ActiveTabRecordingModalProps {
  isOpen: boolean;
  stream: MediaStream | null;
  onStop: () => void;
  hasAudio: boolean;
}

export const ActiveTabRecordingModal: React.FC<ActiveTabRecordingModalProps> = ({
  isOpen,
  stream,
  onStop,
  hasAudio,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const MAX_CAPTURE_SECONDS = 45;

  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= MAX_CAPTURE_SECONDS) {
          clearInterval(interval);
          onStop();
          return MAX_CAPTURE_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, onStop]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (elapsedSeconds / MAX_CAPTURE_SECONDS) * 100);

  return (
    <div
      id="active-tab-recording-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']"
    >
      <div className="w-full max-w-lg bg-[#141418] border border-orange-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/50 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glowing Indicator */}
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4 relative">
          <div className="w-6 h-6 rounded-full bg-red-500 animate-ping absolute opacity-75" />
          <div className="w-6 h-6 rounded-full bg-red-500 relative" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider mb-2">
          <span>● Recording Tab Video</span>
          <span className="text-zinc-500">|</span>
          <span className="text-amber-400 font-bold">45s Max Parody Cap</span>
        </div>

        <h3 className="text-2xl font-black text-white font-['Outfit']">
          Capturing Browser Tab
        </h3>

        <div className="text-4xl font-black text-amber-300 font-mono my-3">
          {formatTime(elapsedSeconds)} <span className="text-base text-zinc-500 font-normal">/ 00:45</span>
        </div>

        {/* 45s Progress Bar */}
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-4 border border-zinc-700">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-sm text-zinc-300 max-w-md leading-relaxed">
          Switch to your target tab and play the scene (5–45 seconds). When you reach the end, click the button below or the browser&apos;s &quot;Stop sharing&quot; banner.
        </p>

        {/* Audio status reminder */}
        <div className={`mt-4 w-full p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-left border ${
          hasAudio
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {hasAudio ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tab audio captured! AI will auto-transcribe spoken lines for dubbing.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Note: Tab audio wasn&apos;t shared. (Make sure &quot;Also share tab audio&quot; is checked for auto-transcription).</span>
            </>
          )}
        </div>

        {/* Big Stop Button */}
        <button
          id="finish-tab-recording-btn"
          onClick={onStop}
          className="mt-6 w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-950/60 border border-red-400/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <StopCircle className="w-5 h-5" />
          <span>Done! Finish &amp; Import Clip</span>
        </button>
      </div>
    </div>
  );
};
