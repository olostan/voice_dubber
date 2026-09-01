import React, { useState, useEffect } from 'react';
import { AudioTake, Character, Player } from '../types';
import { exportDubbedVideo } from '../utils/videoCapture';
import { drawAnimatedScene, PresetClipInfo } from '../utils/presetClips';
import { X, Download, Film, CheckCircle2, Play, RefreshCw, Sparkles, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  presetClip: PresetClipInfo | null;
  duration: number;
  audioTakes: AudioTake[];
  characters: Character[];
  players: Player[];
  videoVolume: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  presetClip,
  duration,
  audioTakes,
  characters,
  players,
  videoVolume,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !exportUrl && !isExporting) {
      handleStartExport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setExportUrl(null);

    try {
      const drawer = presetClip
        ? (ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => {
            drawAnimatedScene(ctx, presetClip.renderType, time, w, h);
          }
        : null;

      const { url } = await exportDubbedVideo(
        videoElement,
        drawer,
        duration,
        audioTakes,
        videoVolume,
        (pct) => setProgress(pct)
      );

      setExportUrl(url);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-['Outfit']">
                Export Dubbed Masterpiece
              </h2>
              <p className="text-xs text-zinc-400">
                Compositing video frames, voiceover tracks, and real-time audio filters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Progress / Status Bar */}
          {isExporting ? (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/60 rounded-2xl border border-zinc-800 gap-4 text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-white">Rendering & Compositing Video...</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Synchronizing {audioTakes.length} voice tracks with audio filters and video canvas.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-150"
                />
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">{progress}% Completed</span>
            </div>
          ) : exportUrl ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Export ready! All multi-tracks mixed and synchronized perfectly.</span>
              </div>

              {/* Video Player Preview */}
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                <video src={exportUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>

              {/* Download Action */}
              <a
                href={exportUrl}
                download="the-choice-voicer-dub.webm"
                className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-950/60 border border-orange-400/40 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Dubbed Video (.webm)</span>
              </a>
            </div>
          ) : null}

          {/* Track Summary List */}
          <div className="flex flex-col gap-2 p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Mixed Audio Tracks in this Export:</span>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900">
                <span className="text-zinc-300 font-semibold">Original Video Audio</span>
                <span className="text-zinc-400 font-mono">{Math.round(videoVolume * 100)}% Volume</span>
              </div>

              {characters.map((char) => {
                const take = audioTakes.find((t) => t.characterId === char.id);
                const player = players.find((p) => p.characterId === char.id);
                return (
                  <div
                    key={char.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: char.color }} />
                      <span className="text-white font-bold">{char.name}</span>
                      <span className="text-zinc-400">({player?.name || 'Actor'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-800 text-orange-300 rounded border border-zinc-700">
                        FX: {take?.effect || player?.voiceEffect || 'Natural'}
                      </span>
                      <span className="text-zinc-400 font-mono">
                        {take ? `${take.duration.toFixed(1)}s` : 'No take'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
