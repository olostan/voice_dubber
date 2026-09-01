import React, { useRef } from 'react';
import { Film, ScreenShare, Upload, Sparkles, Shield } from 'lucide-react';

interface ClipSelectorProps {
  onCaptureTab: () => void;
  onUploadVideo: (file: File) => void;
  isCapturing: boolean;
  onOpenPrivacy?: () => void;
}

export const ClipSelector: React.FC<ClipSelectorProps> = ({
  onCaptureTab,
  onUploadVideo,
  isCapturing,
  onOpenPrivacy,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  return (
    <div id="clip-selector-container" className="w-full bg-[#121216] rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-['Plus_Jakarta_Sans']">
      {/* Left info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
          <Film className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-2">
            <span>Video Tab Capture & Upload</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              45s Max
            </span>
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Capture any video tab with sound to automatically transcribe lines for parody dubbing.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          id="tab-capture-action-btn"
          onClick={onCaptureTab}
          disabled={isCapturing}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
            isCapturing
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black border-transparent shadow-md'
          }`}
        >
          <ScreenShare className="w-3.5 h-3.5 text-black" />
          <span>{isCapturing ? 'Capturing Tab...' : 'Capture Video Tab'}</span>
        </button>

        <button
          id="upload-video-action-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-orange-400" />
          <span>Upload File</span>
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
  );
};
