import React, { useEffect, useRef, useState } from 'react';
import { Character, ScriptLine, VideoSource } from '../types';
import { drawAnimatedScene, PresetClipInfo } from '../utils/presetClips';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Sparkles, Mic, Scissors, ChevronDown } from 'lucide-react';

interface VideoCanvasPlayerProps {
  videoSource: VideoSource | null;
  presetClip: PresetClipInfo | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onTrimBefore?: (time: number) => void;
  onTrimAfter?: (time: number) => void;
  currentScriptLines: ScriptLine[];
  characters: Character[];
  activeRecordingCharacterId: string | null;
  isRecording: boolean;
  countdown: number | null; // 3, 2, 1, or null
  videoVolume: number;
  onVolumeChange: (vol: number) => void;
  onCanvasRefReady?: (canvas: HTMLCanvasElement | null) => void;
  onVideoElementReady?: (video: HTMLVideoElement | null) => void;
}

export const VideoCanvasPlayer: React.FC<VideoCanvasPlayerProps> = ({
  videoSource,
  presetClip,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onTrimBefore,
  onTrimAfter,
  currentScriptLines,
  characters,
  activeRecordingCharacterId,
  isRecording,
  countdown,
  videoVolume,
  onVolumeChange,
  onCanvasRefReady,
  onVideoElementReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isTrimMenuOpen, setIsTrimMenuOpen] = useState(false);

  const trimStartOffset = videoSource?.trimStartOffset || 0;

  // Send references to parent
  useEffect(() => {
    if (onCanvasRefReady) onCanvasRefReady(canvasRef.current);
  }, [onCanvasRefReady]);

  useEffect(() => {
    if (onVideoElementReady) onVideoElementReady(videoRef.current);
  }, [onVideoElementReady]);

  // Synchronize video element playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource?.url) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoSource]);

  // Synchronize video frame when paused or seeked
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPlaying) return;
    const targetVideoTime = currentTime + trimStartOffset;
    if (Math.abs(video.currentTime - targetVideoTime) > 0.05) {
      video.currentTime = targetVideoTime;
    }
  }, [currentTime, isPlaying, trimStartOffset]);

  // Synchronize video element volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = videoVolume;
    }
  }, [videoVolume]);

  // Canvas drawing loop for preset animated clips
  useEffect(() => {
    if (videoSource?.type === 'screen_capture' || videoSource?.type === 'upload') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !presetClip) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawAnimatedScene(ctx, presetClip.renderType, currentTime + trimStartOffset, canvas.width, canvas.height);
  }, [currentTime, presetClip, videoSource, trimStartOffset]);

  // Find currently active script line
  const activeLine = currentScriptLines.find(
    (line) => currentTime >= line.startTime && currentTime <= line.endTime
  );

  // Find upcoming script line
  const upcomingLine = currentScriptLines.find(
    (line) => line.startTime > currentTime && line.startTime <= currentTime + 2.5
  );

  // Active speaking character info
  const activeCharacter = characters.find(
    (c) => c.id === (activeLine?.speakerId || activeRecordingCharacterId)
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 group flex flex-col justify-between"
    >
      {/* Video Element for Screen Captures & Uploads */}
      {videoSource && (videoSource.type === 'screen_capture' || videoSource.type === 'upload') ? (
        <video
          ref={videoRef}
          src={videoSource.url}
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          onEnded={() => onSeek(duration)}
        />
      ) : (
        /* Canvas for Preset Animated Clips */
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full object-contain bg-[#0A0A0B]"
        />
      )}

      {/* Top Overlay: Clip Title & Recording Status Badge */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/85 via-black/35 to-transparent">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700/80 text-xs font-bold text-zinc-200">
            {videoSource?.title || presetClip?.title || 'Clip Preview'}
          </span>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/90 text-white text-xs font-black animate-pulse shadow-lg shadow-orange-950">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>RECORDING DUB TAKE</span>
            </div>
          )}
        </div>

        {/* Active Character Badge */}
        {activeCharacter && (
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold text-white shadow-md backdrop-blur-md border border-white/20"
            style={{ backgroundColor: `${activeCharacter.color}CC` }}
          >
            <span className="text-base">{activeCharacter.avatarIcon || '🎭'}</span>
            <span>{activeCharacter.name}</span>
            {isRecording && <Mic className="w-3.5 h-3.5 animate-bounce" />}
          </div>
        )}
      </div>

      {/* Big 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="text-8xl md:text-9xl font-black text-orange-500 font-['Outfit'] animate-scale-pulse drop-shadow-[0_10px_30px_rgba(249,115,22,0.6)]">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <p className="text-sm md:text-base font-bold text-zinc-200 mt-2 uppercase tracking-widest">
              {countdown === 0 ? '🎙️ Record your voice now!' : 'Get ready to dub...'}
            </p>
          </div>
        </div>
      )}

      {/* Center Subtitle Teleprompter HUD */}
      <div className="relative z-20 px-4 pb-2">
        {activeLine ? (
          <div className="max-w-2xl mx-auto bg-zinc-950/90 backdrop-blur-md border-2 border-orange-500/80 rounded-2xl p-3.5 text-center shadow-2xl shadow-orange-950/50 animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                {activeLine.speakerName}
              </span>
              {activeLine.cue && (
                <span className="text-[11px] font-semibold italic text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {activeLine.cue}
                </span>
              )}
            </div>
            <p className="text-lg md:text-xl font-extrabold text-white leading-snug drop-shadow-md">
              "{activeLine.text}"
            </p>
          </div>
        ) : upcomingLine ? (
          <div className="max-w-md mx-auto bg-zinc-900/70 backdrop-blur-sm border border-zinc-700/60 rounded-xl p-2 text-center">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Next: <strong className="text-zinc-200">{upcomingLine.speakerName}</strong> in{' '}
              {Math.max(0, upcomingLine.startTime - currentTime).toFixed(1)}s
            </span>
          </div>
        ) : null}
      </div>

      {/* Bottom Floating Transport Controls Bar */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2">
        {/* Scrubber Bar */}
        <div className="relative w-full flex items-center group/scrubber cursor-pointer">
          <input
            id="video-scrubber"
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:h-2.5 transition-all"
          />
          {/* Active script line tick markers on the scrubber */}
          {currentScriptLines.map((line) => {
            const leftPct = (line.startTime / (duration || 1)) * 100;
            const widthPct = ((line.endTime - line.startTime) / (duration || 1)) * 100;
            return (
              <div
                key={line.id}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                className="absolute top-0 h-1.5 bg-orange-400/40 pointer-events-none rounded-sm"
                title={`${line.speakerName}: ${line.text}`}
              />
            );
          })}
        </div>

        {/* Buttons & Time row */}
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              id="player-play-pause-btn"
              onClick={onPlayPause}
              disabled={isRecording}
              className={`p-2 rounded-xl transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-950/50'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Restart Button */}
            <button
              id="player-restart-btn"
              onClick={() => onSeek(0)}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-all"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Time readout */}
            <div className="font-mono text-xs text-zinc-200">
              <span className="font-bold text-white">{formatTime(currentTime)}</span>
              <span className="text-zinc-500"> / {formatTime(duration)}</span>
            </div>

            {/* Crop / Trim Start & End Action Menu */}
            {(onTrimBefore || onTrimAfter) && (
              <div className="relative">
                <button
                  id="player-trim-menu-btn"
                  onClick={() => setIsTrimMenuOpen(!isTrimMenuOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    isTrimMenuOpen
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:border-zinc-600 hover:text-white'
                  }`}
                  title="Crop / Trim start or end of video"
                >
                  <Scissors className="w-3.5 h-3.5 text-orange-400" />
                  <span>Trim</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {isTrimMenuOpen && (
                  <div
                    id="player-trim-dropdown"
                    className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-700/90 rounded-2xl p-2 shadow-2xl shadow-black z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2 py-1 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5" />
                        Crop Clip
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">At {formatTime(currentTime)}</span>
                    </div>

                    {onTrimBefore && (
                      <button
                        id="trim-start-btn"
                        onClick={() => {
                          onTrimBefore(currentTime);
                          setIsTrimMenuOpen(false);
                        }}
                        disabled={currentTime < 0.2 || currentTime >= duration - 0.5}
                        className="flex flex-col items-start px-2.5 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          ✂️ Trim Start (Remove Before)
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">
                          Cut 0:00 → {formatTime(currentTime)} (New len: {formatTime(Math.max(0, duration - currentTime))})
                        </span>
                      </button>
                    )}

                    {onTrimAfter && (
                      <button
                        id="trim-end-btn"
                        onClick={() => {
                          onTrimAfter(currentTime);
                          setIsTrimMenuOpen(false);
                        }}
                        disabled={currentTime < 0.5 || currentTime >= duration - 0.2}
                        className="flex flex-col items-start px-2.5 py-2 rounded-xl text-left hover:bg-zinc-800 text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          ✂️ Trim End (Remove After)
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">
                          Cut {formatTime(currentTime)} → {formatTime(duration)} (New len: {formatTime(currentTime)})
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Volume & Fullscreen */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2 py-1 rounded-xl border border-zinc-800">
              <button
                id="player-mute-btn"
                onClick={() => {
                  if (videoVolume === 0) {
                    onVolumeChange(0.8);
                  } else {
                    onVolumeChange(0);
                  }
                }}
                className="text-zinc-400 hover:text-zinc-200"
                title={videoVolume === 0 ? "Unmute video audio" : "Mute video audio"}
              >
                {videoVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
                )}
              </button>
              <input
                id="video-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={videoVolume}
                onChange={(e) => {
                  onVolumeChange(parseFloat(e.target.value));
                }}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none accent-zinc-300 cursor-pointer"
                title="Original Video Audio Volume"
              />
            </div>

            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
