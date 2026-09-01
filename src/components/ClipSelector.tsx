import React, { useRef } from 'react';
import { PRESET_CLIPS, PresetClipInfo } from '../utils/presetClips';
import { Film, ScreenShare, Upload, Sparkles, Play } from 'lucide-react';

interface ClipSelectorProps {
  selectedClipId: string | null;
  onSelectPreset: (clip: PresetClipInfo) => void;
  onCaptureTab: () => void;
  onUploadVideo: (file: File) => void;
  isCapturing: boolean;
}

export const ClipSelector: React.FC<ClipSelectorProps> = ({
  selectedClipId,
  onSelectPreset,
  onCaptureTab,
  onUploadVideo,
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
    <div id="clip-selector-container" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
            Source Video Clips & Tab Capture
          </h3>
        </div>

        {/* Custom Capture & Upload Actions */}
        <div className="flex items-center gap-2">
          <button
            id="tab-capture-action-btn"
            onClick={onCaptureTab}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCapturing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            <ScreenShare className="w-3.5 h-3.5 text-orange-400" />
            <span>{isCapturing ? 'Capturing Tab...' : 'Capture Any Tab'}</span>
          </button>

          <button
            id="upload-video-action-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-orange-400" />
            <span>Upload MP4</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Preset Clips Carousel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_CLIPS.map((clip) => {
          const isSelected = selectedClipId === clip.id;
          return (
            <button
              key={clip.id}
              id={`preset-clip-${clip.id}`}
              onClick={() => onSelectPreset(clip)}
              className={`flex flex-col p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500 shadow-lg shadow-orange-950/40'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              {/* Genre badge & duration */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  {clip.genre}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{clip.duration}s</span>
              </div>

              <h4 className="text-xs font-extrabold text-white group-hover:text-orange-300 transition-colors">
                {clip.title}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {clip.description}
              </p>

              {/* Characters Preview */}
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-zinc-800/80">
                {clip.defaultCharacters.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-lg text-zinc-300 bg-zinc-900 border border-zinc-800 flex items-center gap-1"
                  >
                    <span>{c.avatarIcon}</span>
                    <span className="text-[10px] font-medium">{c.name.split(' ')[0]}</span>
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
