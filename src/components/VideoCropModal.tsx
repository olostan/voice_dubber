import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Maximize2,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  RectangleHorizontal,
  Move,
  AlignCenter,
} from 'lucide-react';
import { VideoAspectRatio, VideoCropBounds, VideoSource } from '../types';

interface VideoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSource: VideoSource | null;
  currentTime: number;
  onApplyCrop: (cropBounds: VideoCropBounds | undefined) => void;
}

export const VideoCropModal: React.FC<VideoCropModalProps> = ({
  isOpen,
  onClose,
  videoSource,
  currentTime,
  onApplyCrop,
}) => {
  const [selectedRatio, setSelectedRatio] = useState<VideoAspectRatio>(
    videoSource?.cropBounds?.aspectRatio || (videoSource?.cropBounds ? 'free' : 'free')
  );

  // Normalized crop bounds: 0.0 to 1.0
  const [crop, setCrop] = useState<VideoCropBounds>(() => {
    if (videoSource?.cropBounds) {
      return { ...videoSource.cropBounds };
    }
    return { x: 0, y: 0, width: 1, height: 1, aspectRatio: 'free' };
  });

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragTypeRef = useRef<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | null
  >(null);
  const startMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCropRef = useRef<VideoCropBounds>({ x: 0, y: 0, width: 1, height: 1 });

  // Sync state when modal opens or videoSource changes
  useEffect(() => {
    if (isOpen) {
      if (videoSource?.cropBounds) {
        setCrop({ ...videoSource.cropBounds });
        setSelectedRatio(videoSource.cropBounds.aspectRatio || 'free');
      } else {
        setCrop({ x: 0, y: 0, width: 1, height: 1, aspectRatio: 'free' });
        setSelectedRatio('free');
      }
    }
  }, [isOpen, videoSource]);

  // Sync video preview frame
  useEffect(() => {
    const video = videoPreviewRef.current;
    if (!video || !videoSource?.url) return;
    const targetTime = currentTime + (videoSource.trimStartOffset || 0);
    video.currentTime = targetTime;
  }, [currentTime, videoSource, isOpen]);

  // Helper to calculate target crop for a given aspect ratio
  const calculatePresetCrop = useCallback(
    (ratio: VideoAspectRatio, currentSourceWidth = 1280, currentSourceHeight = 720): VideoCropBounds => {
      if (ratio === 'free') {
        return { ...crop, aspectRatio: 'free' };
      }

      let targetRatioValue = 16 / 9;
      if (ratio === '9:16') targetRatioValue = 9 / 16;
      else if (ratio === '1:1') targetRatioValue = 1;
      else if (ratio === '4:3') targetRatioValue = 4 / 3;
      else if (ratio === '16:9') targetRatioValue = 16 / 9;

      const sourceRatio = currentSourceWidth / currentSourceHeight;

      let newWidth = 1;
      let newHeight = 1;

      if (targetRatioValue < sourceRatio) {
        // Target is taller / narrower than source (e.g. 9:16 inside 16:9 screen capture)
        newHeight = 0.92;
        const pixelHeight = newHeight * currentSourceHeight;
        const pixelWidth = pixelHeight * targetRatioValue;
        newWidth = pixelWidth / currentSourceWidth;
      } else {
        // Target is wider than source
        newWidth = 0.92;
        const pixelWidth = newWidth * currentSourceWidth;
        const pixelHeight = pixelWidth / targetRatioValue;
        newHeight = pixelHeight / currentSourceHeight;
      }

      // Center the box
      const newX = Math.max(0, (1 - newWidth) / 2);
      const newY = Math.max(0, (1 - newHeight) / 2);

      return {
        x: newX,
        y: newY,
        width: Math.min(1, newWidth),
        height: Math.min(1, newHeight),
        aspectRatio: ratio,
      };
    },
    [crop]
  );

  // Handle preset ratio selection
  const handleSelectRatio = (ratio: VideoAspectRatio) => {
    setSelectedRatio(ratio);
    if (ratio === 'free') {
      setCrop((prev) => ({ ...prev, aspectRatio: 'free' }));
    } else {
      const vid = videoPreviewRef.current;
      const w = vid?.videoWidth || videoSource?.width || 1280;
      const h = vid?.videoHeight || videoSource?.height || 720;
      const newPreset = calculatePresetCrop(ratio, w, h);
      setCrop(newPreset);
    }
  };

  // Reset to full frame
  const handleResetCrop = () => {
    setSelectedRatio('free');
    setCrop({ x: 0, y: 0, width: 1, height: 1, aspectRatio: 'free' });
  };

  // Center horizontally or vertically
  const handleCenterCrop = () => {
    setCrop((prev) => ({
      ...prev,
      x: Math.max(0, (1 - prev.width) / 2),
      y: Math.max(0, (1 - prev.height) / 2),
    }));
  };

  // Mouse Drag / Touch Gestures for Resize & Move
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragTypeRef.current = type;
    startMousePosRef.current = { x: e.clientX, y: e.clientY };
    startCropRef.current = { ...crop };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !previewContainerRef.current) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dx = (moveEvent.clientX - startMousePosRef.current.x) / rect.width;
      const dy = (moveEvent.clientY - startMousePosRef.current.y) / rect.height;

      const init = startCropRef.current;
      const MIN_SIZE = 0.08;

      let nextX = init.x;
      let nextY = init.y;
      let nextW = init.width;
      let nextH = init.height;

      const drag = dragTypeRef.current;

      if (drag === 'move') {
        nextX = Math.max(0, Math.min(1 - init.width, init.x + dx));
        nextY = Math.max(0, Math.min(1 - init.height, init.y + dy));
      } else {
        // Resize handles
        if (drag?.includes('w')) {
          const maxLeft = init.x + init.width - MIN_SIZE;
          nextX = Math.max(0, Math.min(maxLeft, init.x + dx));
          nextW = init.width - (nextX - init.x);
        }
        if (drag?.includes('e')) {
          nextW = Math.max(MIN_SIZE, Math.min(1 - init.x, init.width + dx));
        }
        if (drag?.includes('n')) {
          const maxTop = init.y + init.height - MIN_SIZE;
          nextY = Math.max(0, Math.min(maxTop, init.y + dy));
          nextH = init.height - (nextY - init.y);
        }
        if (drag?.includes('s')) {
          nextH = Math.max(MIN_SIZE, Math.min(1 - init.y, init.height + dy));
        }

        // Maintain fixed aspect ratio if preset is selected and not freeform
        if (selectedRatio !== 'free') {
          const vid = videoPreviewRef.current;
          const srcW = vid?.videoWidth || 1280;
          const srcH = vid?.videoHeight || 720;
          let targetRatio = 16 / 9;
          if (selectedRatio === '9:16') targetRatio = 9 / 16;
          else if (selectedRatio === '1:1') targetRatio = 1;
          else if (selectedRatio === '4:3') targetRatio = 4 / 3;

          const pixelW = nextW * srcW;
          const pixelH = nextH * srcH;

          if (drag === 'e' || drag === 'w') {
            const adjustedPixelH = pixelW / targetRatio;
            nextH = Math.min(1 - nextY, adjustedPixelH / srcH);
          } else if (drag === 'n' || drag === 's') {
            const adjustedPixelW = pixelH * targetRatio;
            nextW = Math.min(1 - nextX, adjustedPixelW / srcW);
          }
        }
      }

      setCrop({
        x: Math.max(0, Math.min(1 - MIN_SIZE, nextX)),
        y: Math.max(0, Math.min(1 - MIN_SIZE, nextY)),
        width: Math.max(MIN_SIZE, Math.min(1, nextW)),
        height: Math.max(MIN_SIZE, Math.min(1, nextH)),
        aspectRatio: selectedRatio,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      dragTypeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleApply = () => {
    // If crop is full frame (0,0, 1,1) with free aspect, treat as undefined/reset
    const isFull =
      crop.x <= 0.01 &&
      crop.y <= 0.01 &&
      crop.width >= 0.99 &&
      crop.height >= 0.99 &&
      selectedRatio === 'free';

    if (isFull) {
      onApplyCrop(undefined);
    } else {
      onApplyCrop({
        ...crop,
        aspectRatio: selectedRatio,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const isFullFrame = crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans']">
      <div
        className="relative w-full max-w-4xl bg-[#141418] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-200 max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black font-black shadow-lg shadow-orange-950/40">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white flex items-center gap-2">
                Crop Video & Set Aspect Ratio
              </h2>
              <p className="text-xs text-zinc-400">
                Drag the crop box to frame your video and remove unwanted browser tab sidebars.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-6 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 mr-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Presets:
            </span>

            {/* 9:16 Shorts Preset */}
            <button
              id="crop-preset-9-16"
              onClick={() => handleSelectRatio('9:16')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === '9:16'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Shorts / Reels</span>
            </button>

            {/* 16:9 Landscape Preset */}
            <button
              id="crop-preset-16-9"
              onClick={() => handleSelectRatio('16:9')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === '16:9'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <RectangleHorizontal className="w-3.5 h-3.5" />
              <span>16:9 Cinema</span>
            </button>

            {/* 1:1 Square Preset */}
            <button
              id="crop-preset-1-1"
              onClick={() => handleSelectRatio('1:1')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === '1:1'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1 Square</span>
            </button>

            {/* 4:3 Retro TV Preset */}
            <button
              id="crop-preset-4-3"
              onClick={() => handleSelectRatio('4:3')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === '4:3'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>4:3 TV</span>
            </button>

            {/* Freeform */}
            <button
              id="crop-preset-free"
              onClick={() => handleSelectRatio('free')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRatio === 'free'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Freeform</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCenterCrop}
              title="Center Crop Box"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition-all cursor-pointer"
            >
              <AlignCenter className="w-3.5 h-3.5 text-amber-400" />
              <span>Center</span>
            </button>

            <button
              onClick={handleResetCrop}
              title="Reset to Full Frame"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Full Tab</span>
            </button>
          </div>
        </div>

        {/* Video Canvas & Interactive Bounding Box Workspace */}
        <div className="relative flex-1 p-4 sm:p-6 flex items-center justify-center bg-black/90 overflow-hidden min-h-[340px]">
          <div
            ref={previewContainerRef}
            className="relative w-full aspect-video max-w-2xl max-h-[55vh] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl select-none"
          >
            {/* Frozen Video Frame */}
            {videoSource?.url && (
              <video
                ref={videoPreviewRef}
                src={videoSource.url}
                playsInline
                muted
                className="w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* Darkened Mask Over Uncropped Area */}
            {/* Top mask */}
            <div
              className="absolute left-0 top-0 right-0 bg-black/75 pointer-events-none transition-all duration-75"
              style={{ height: `${crop.y * 100}%` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/75 pointer-events-none transition-all duration-75"
              style={{ height: `${(1 - (crop.y + crop.height)) * 100}%` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-black/75 pointer-events-none transition-all duration-75"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.height * 100}%`,
                width: `${crop.x * 100}%`,
              }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-black/75 pointer-events-none transition-all duration-75"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.height * 100}%`,
                width: `${(1 - (crop.x + crop.width)) * 100}%`,
              }}
            />

            {/* Interactive Crop Rectangle */}
            <div
              id="interactive-crop-box"
              className="absolute border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-move transition-all duration-75"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Rule-of-Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-orange-500/25" />
                <div className="border-r border-b border-orange-500/25" />
                <div className="border-b border-orange-500/25" />
                <div className="border-r border-b border-orange-500/25" />
                <div className="border-r border-b border-orange-500/25" />
                <div className="border-b border-orange-500/25" />
                <div className="border-r border-orange-500/25" />
                <div className="border-r border-orange-500/25" />
                <div />
              </div>

              {/* Move Center Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                <div className="px-2.5 py-1 rounded-full bg-black/75 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider text-orange-300 flex items-center gap-1 backdrop-blur-sm">
                  <Move className="w-3 h-3" />
                  <span>Drag to Move</span>
                </div>
              </div>

              {/* 4 Corner Resize Handles */}
              <div
                className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />
              <div
                className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />

              {/* 4 Edge Resize Handles */}
              <div
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 rounded-full bg-orange-500/90 border border-white cursor-ew-resize shadow-sm hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'w')}
              />
              <div
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 rounded-full bg-orange-500/90 border border-white cursor-ew-resize shadow-sm hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'e')}
              />
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-orange-500/90 border border-white cursor-ns-resize shadow-sm hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'n')}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-orange-500/90 border border-white cursor-ns-resize shadow-sm hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 's')}
              />
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/80 border-t border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-zinc-300">
              {Math.round(crop.width * 100)}% × {Math.round(crop.height * 100)}%
            </span>
            <span className="capitalize font-bold text-orange-400">
              {selectedRatio === 'free' ? 'Custom Freeform' : `${selectedRatio} Aspect`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="apply-crop-btn"
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/60 border border-orange-400/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isFullFrame ? 'Reset Full Video' : 'Apply Crop Bounds'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
