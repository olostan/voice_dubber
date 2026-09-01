import React, { useRef } from 'react';
import { ScreenShare, Upload, Sparkles, Mic, Layers, Wand2, Play } from 'lucide-react';
import { PRESET_CLIPS, PresetClipInfo } from '../utils/presetClips';

interface WelcomeCapturePromptProps {
  onCaptureTab: () => void;
  onUploadVideo: (file: File) => void;
  onSelectPreset: (clip: PresetClipInfo) => void;
  isCapturing: boolean;
}

export const WelcomeCapturePrompt: React.FC<WelcomeCapturePromptProps> = ({
  onCaptureTab,
  onUploadVideo,
  onSelectPreset,
  isCapturing,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  return (
    <div
      id="welcome-capture-container"
      className="w-full flex flex-col items-center justify-center py-8 px-4 max-w-4xl mx-auto animate-fade-in"
    >
      {/* Hero Welcome Card */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Party Dubbing Game</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Outfit'] tracking-tight max-w-2xl">
          Record a Video Tab & Dub Over Original Voices
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-zinc-400 mt-4 max-w-xl leading-relaxed">
          Capture any video playing in a browser tab (YouTube, movies, anime, clips).
          The AI will automatically transcribe speech, segment character lines, and let you and your friends re-record hilarious voice tracks!
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto">
          <button
            id="hero-record-tab-btn"
            onClick={onCaptureTab}
            disabled={isCapturing}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-950/60 border border-orange-400/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <ScreenShare className="w-5 h-5" />
            <span>{isCapturing ? 'Capturing Browser Tab...' : 'Record Video from Tab'}</span>
          </button>

          <button
            id="hero-upload-video-btn"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-sm border border-zinc-700 transition-all"
          >
            <Upload className="w-4 h-4 text-orange-400" />
            <span>Upload Video File (MP4/WebM)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 3 Step Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full text-left">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-black">
              1
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Capture Tab Video
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Select any open browser tab with sound. Play 5 to 30 seconds of your favorite scene.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-black">
              2
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Auto-Transcribe & Diarize
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              AI listens to audio, detects dialogue timestamps, and separates lines by character roles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-black">
              3
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Dub Over & Re-record Voices
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Record microphone takes with custom pitch and vocal effects for each character track!
            </p>
          </div>
        </div>

        {/* Sample Scene Presets Fallback */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <span>Don&apos;t have a video open right now?</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-zinc-400 font-semibold">Try a sample scene:</span>
            {PRESET_CLIPS.slice(0, 2).map((clip) => (
              <button
                key={clip.id}
                onClick={() => onSelectPreset(clip)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium transition-all flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-orange-400" />
                <span>{clip.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
