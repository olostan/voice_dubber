import React, { useState, useEffect, useRef } from 'react';
import { AudioTake, Character, OriginalAudioMode, Player, ScriptLine, VoiceEffect } from '../types';
import { Volume2, VolumeX, Trash2, Mic, Eye, Radio, Sparkles, Layers, Scissors, MoveHorizontal } from 'lucide-react';

interface MultiTrackTimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onTrimBefore?: (time: number) => void;
  onTrimAfter?: (time: number) => void;
  characters: Character[];
  players: Player[];
  audioTakes: AudioTake[];
  activeRecordingCharacterId: string | null;
  onSelectRecordingCharacter: (charId: string) => void;
  onToggleMuteTake: (takeId: string) => void;
  onToggleSoloTake: (takeId: string) => void;
  onChangeTakeVolume: (takeId: string, vol: number) => void;
  onChangeTakeEffect: (takeId: string, effect: VoiceEffect) => void;
  onDeleteTake: (takeId: string) => void;
  onUpdateTakeOffset?: (takeId: string, newOffset: number) => void;
  scriptLines: ScriptLine[];
  videoVolume: number;
  onVideoVolumeChange: (vol: number) => void;
  originalAudioMode?: OriginalAudioMode;
  onChangeOriginalAudioMode?: (mode: OriginalAudioMode) => void;
  isRecording: boolean;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  onTrimBefore,
  onTrimAfter,
  characters,
  players,
  audioTakes,
  activeRecordingCharacterId,
  onSelectRecordingCharacter,
  onToggleMuteTake,
  onToggleSoloTake,
  onChangeTakeVolume,
  onChangeTakeEffect,
  onDeleteTake,
  onUpdateTakeOffset,
  scriptLines,
  videoVolume,
  onVideoVolumeChange,
  originalAudioMode = 'duck_10',
  onChangeOriginalAudioMode,
  isRecording,
}) => {
  const effectiveDuration = Math.max(5, duration);

  // Take drag state
  const [draggingTakeId, setDraggingTakeId] = useState<string | null>(null);
  const [dragOffsetPreview, setDragOffsetPreview] = useState<{ id: string; offset: number } | null>(null);
  const dragStartInfo = useRef<{ startX: number; initialOffset: number; timelineWidth: number; takeDuration: number } | null>(null);

  useEffect(() => {
    if (!draggingTakeId || !dragStartInfo.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { startX, initialOffset, timelineWidth, takeDuration } = dragStartInfo.current!;
      const deltaX = e.clientX - startX;
      const deltaSec = (deltaX / timelineWidth) * effectiveDuration;
      const rawOffset = initialOffset + deltaSec;
      const maxOffset = Math.max(0, effectiveDuration - takeDuration);
      const clampedOffset = Math.max(0, Math.min(maxOffset, parseFloat(rawOffset.toFixed(2))));
      setDragOffsetPreview({ id: draggingTakeId, offset: clampedOffset });
    };

    const handleMouseUp = () => {
      if (dragOffsetPreview && onUpdateTakeOffset) {
        onUpdateTakeOffset(dragOffsetPreview.id, dragOffsetPreview.offset);
      }
      setDraggingTakeId(null);
      setDragOffsetPreview(null);
      dragStartInfo.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTakeId, dragOffsetPreview, effectiveDuration, onUpdateTakeOffset]);

  const handleTakeMouseDown = (e: React.MouseEvent, take: AudioTake) => {
    e.stopPropagation();
    if (!onUpdateTakeOffset) return;
    const laneElem = (e.currentTarget.parentElement as HTMLElement);
    const laneRect = laneElem.getBoundingClientRect();
    dragStartInfo.current = {
      startX: e.clientX,
      initialOffset: take.startTimeOffset,
      timelineWidth: laneRect.width,
      takeDuration: take.duration,
    };
    setDraggingTakeId(take.id);
    setDragOffsetPreview({ id: take.id, offset: take.startTimeOffset });
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingTakeId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * effectiveDuration);
  };

  // Generate ruler tick marks
  const rulerTicks = [];
  const tickInterval = effectiveDuration > 30 ? 5 : 2;
  for (let t = 0; t <= effectiveDuration; t += tickInterval) {
    rulerTicks.push(t);
  }

  return (
    <div id="multi-track-timeline" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-3">
      {/* Header Info & Track Stats & Quick Trim Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <Layers className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
            Multi-Track Voiceover Studio
          </h3>
          <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
            {characters.length} Character Tracks • {audioTakes.length} Takes Recorded
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
          {/* Quick Trim Buttons */}
          {(onTrimBefore || onTrimAfter) && (
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
              <Scissors className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold text-zinc-500 mr-0.5">Crop:</span>
              {onTrimBefore && (
                <button
                  id="timeline-trim-start-btn"
                  onClick={() => onTrimBefore(currentTime)}
                  disabled={currentTime < 0.2 || currentTime >= duration - 0.5}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-[11px] font-semibold transition-all disabled:opacity-30"
                  title={`Remove everything before ${currentTime.toFixed(1)}s (0:00 -> ${currentTime.toFixed(1)}s)`}
                >
                  Trim Start ({currentTime.toFixed(1)}s)
                </button>
              )}
              {onTrimAfter && (
                <button
                  id="timeline-trim-end-btn"
                  onClick={() => onTrimAfter(currentTime)}
                  disabled={currentTime < 0.5 || currentTime >= duration - 0.2}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-[11px] font-semibold transition-all disabled:opacity-30"
                  title={`Remove everything after ${currentTime.toFixed(1)}s (${currentTime.toFixed(1)}s -> ${duration.toFixed(1)}s)`}
                >
                  Trim End ({currentTime.toFixed(1)}s)
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80" />
            <span>Script Cue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 shadow-sm shadow-emerald-500/50" />
            <span>Recorded Take</span>
          </div>
        </div>
      </div>

      {/* Main Timeline Grid */}
      <div className="flex flex-col border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/70">
        {/* Top Ruler Bar */}
        <div className="flex items-center bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 select-none">
          {/* Left Track Column Header */}
          <div className="w-48 sm:w-56 shrink-0 p-2.5 border-r border-zinc-800 font-semibold text-zinc-300 flex items-center justify-between">
            <span>TRACK / ACTOR</span>
            <span className="text-[10px] text-zinc-400">VOL / FX</span>
          </div>

          {/* Right Ruler Ticks */}
          <div
            onClick={handleTimelineClick}
            className="relative flex-1 h-8 cursor-pointer overflow-hidden group"
          >
            {rulerTicks.map((tick) => {
              const leftPct = (tick / effectiveDuration) * 100;
              return (
                <div
                  key={tick}
                  style={{ left: `${leftPct}%` }}
                  className="absolute top-0 bottom-0 border-l border-zinc-800 flex items-center pl-1"
                >
                  <span className="text-[10px] text-zinc-400">{tick}s</span>
                </div>
              );
            })}

            {/* Playhead Needle on Ruler */}
            <div
              style={{ left: `${(currentTime / effectiveDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-30 pointer-events-none"
            >
              <div className="w-2.5 h-2.5 -ml-1 bg-orange-500 rounded-full shadow-md shadow-orange-950" />
            </div>
          </div>
        </div>

        {/* Track 1: Original Video / Tab Audio Track */}
        <div className="flex items-stretch border-b border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
          {/* Track Header */}
          <div className="w-48 sm:w-56 shrink-0 p-2.5 border-r border-zinc-800 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-3 h-3 rounded-full bg-zinc-500 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-zinc-200 truncate">Video Background</p>
                  <p className="text-[10px] text-zinc-400">Original Tab/Clip Audio</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="track-mute-bg-btn"
                  onClick={() => onVideoVolumeChange(videoVolume > 0 ? 0 : 1)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                  title={videoVolume === 0 ? 'Unmute video audio' : 'Mute video audio'}
                >
                  {videoVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-orange-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={videoVolume}
                  onChange={(e) => onVideoVolumeChange(parseFloat(e.target.value))}
                  className="w-12 h-1 bg-zinc-700 rounded appearance-none accent-zinc-400"
                  title={`Background Volume: ${Math.round(videoVolume * 100)}%`}
                />
              </div>
            </div>

            {/* Original Audio Treatment Mode */}
            {onChangeOriginalAudioMode && (
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/60 text-[10px]">
                <span className="text-zinc-500 font-semibold uppercase">Duck:</span>
                <select
                  id="timeline-audio-mode-select"
                  value={originalAudioMode}
                  onChange={(e) => onChangeOriginalAudioMode(e.target.value as OriginalAudioMode)}
                  className="bg-zinc-950 border border-zinc-700/80 text-amber-300 font-bold rounded-lg px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer w-36 truncate"
                  title="Original audio volume treatment when dubbing"
                >
                  <option value="duck_10">🔉 Duck (10% - Default)</option>
                  <option value="duck_25">🔉 Duck (25% Ambience)</option>
                  <option value="mute">🔇 Mute (0% - Voice Dub)</option>
                  <option value="keep">🔊 Full (100% Original)</option>
                  <option value="smart_duck">⚡ Smart Ducking</option>
                </select>
              </div>
            )}
          </div>

          {/* Track Timeline Lane */}
          <div
            onClick={handleTimelineClick}
            className="relative flex-1 h-14 cursor-pointer overflow-hidden bg-zinc-950/40"
          >
            {/* Subtle background wave bars */}
            <div className="absolute inset-0 flex items-center justify-around opacity-15 px-2 pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: `${20 + Math.sin(i * 0.4) * 20}%` }}
                  className="w-1 bg-zinc-400 rounded-full"
                />
              ))}
            </div>

            {/* Playhead Needle */}
            <div
              style={{ left: `${(currentTime / effectiveDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-30 pointer-events-none"
            />
          </div>
        </div>

        {/* Character Voice Tracks */}
        {characters.map((char) => {
          const takesForChar = audioTakes.filter((t) => t.characterId === char.id);
          const latestTake = takesForChar[takesForChar.length - 1];
          const assignedPlayer = players.find((p) => p.characterId === char.id) || players[0];
          const isTargetedForRecording = activeRecordingCharacterId === char.id;
          const charLines = scriptLines.filter((l) => l.speakerId === char.id);

          const isThisTakeDragging = draggingTakeId === latestTake?.id;
          const currentTakeOffset = isThisTakeDragging && dragOffsetPreview
            ? dragOffsetPreview.offset
            : latestTake?.startTimeOffset ?? 0;

          return (
            <div
              key={char.id}
              className={`flex items-stretch border-b border-zinc-800/80 transition-colors ${
                isTargetedForRecording ? 'bg-orange-950/20' : 'hover:bg-zinc-900/30'
              }`}
            >
              {/* Track Left Controls Header */}
              <div className="w-48 sm:w-56 shrink-0 p-2.5 border-r border-zinc-800 flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: char.color }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-black text-white truncate">{char.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Actor: {assignedPlayer?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {/* Arm for Recording Button */}
                  <button
                    id={`arm-track-${char.id}-btn`}
                    onClick={() => onSelectRecordingCharacter(char.id)}
                    disabled={isRecording}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isTargetedForRecording
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-950 animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Arm this character track for recording"
                  >
                    <Mic className="w-3 h-3" />
                    <span className="text-[10px] hidden sm:inline">ARM</span>
                  </button>
                </div>

                {/* Take Controls (if take recorded) */}
                {latestTake ? (
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1">
                      {/* Mute Take */}
                      <button
                        onClick={() => onToggleMuteTake(latestTake.id)}
                        className={`p-1 rounded text-xs ${
                          latestTake.muted
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Mute track"
                      >
                        {latestTake.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>

                      {/* Solo Take */}
                      <button
                        onClick={() => onToggleSoloTake(latestTake.id)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          latestTake.solo
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Solo this voice track"
                      >
                        S
                      </button>

                      {/* Volume Slider */}
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={latestTake.volume}
                        onChange={(e) => onChangeTakeVolume(latestTake.id, parseFloat(e.target.value))}
                        className="w-10 h-1 bg-zinc-700 rounded appearance-none accent-orange-400"
                        title={`Volume: ${Math.round(latestTake.volume * 100)}%`}
                      />
                    </div>

                    {/* Delete Take */}
                    <button
                      onClick={() => onDeleteTake(latestTake.id)}
                      className="p-1 rounded text-zinc-500 hover:text-orange-400 transition-colors"
                      title="Delete this take"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-400 italic">No take recorded yet</div>
                )}
              </div>

              {/* Track Timeline Waveform Lane */}
              <div
                onClick={handleTimelineClick}
                className="relative flex-1 h-16 cursor-pointer overflow-hidden bg-zinc-950/60"
              >
                {/* Script Cue Regions */}
                {charLines.map((line) => {
                  const leftPct = (line.startTime / effectiveDuration) * 100;
                  const widthPct = ((line.endTime - line.startTime) / effectiveDuration) * 100;
                  return (
                    <div
                      key={line.id}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className="absolute top-1 bottom-1 bg-orange-500/15 border border-orange-500/30 rounded-lg p-1 flex flex-col justify-between overflow-hidden pointer-events-none group/cue"
                    >
                      <span className="text-[9px] font-bold text-orange-300 truncate">
                        "{line.text}"
                      </span>
                      {line.cue && (
                        <span className="text-[8px] text-amber-300/80 italic truncate">
                          [{line.cue}]
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Audio Waveform & VAD Speech Blocks (Draggable Left / Right) */}
                {latestTake && (
                  <div
                    onMouseDown={(e) => handleTakeMouseDown(e, latestTake)}
                    style={{
                      left: `${(currentTakeOffset / effectiveDuration) * 100}%`,
                      width: `${(latestTake.duration / effectiveDuration) * 100}%`,
                    }}
                    className={`absolute top-2 bottom-2 rounded-lg border flex items-center px-1 overflow-hidden transition-shadow select-none group/take ${
                      onUpdateTakeOffset ? 'cursor-ew-resize hover:border-emerald-400' : ''
                    } ${
                      isThisTakeDragging
                        ? 'border-emerald-400 bg-emerald-900/60 shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-400 z-20 cursor-grabbing'
                        : latestTake.muted
                        ? 'opacity-40 border-zinc-700 bg-zinc-900/50'
                        : 'border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-950/60'
                    }`}
                    title="Click and drag left/right to move audio take on the timeline"
                  >
                    {/* Drag Handle Icon */}
                    {onUpdateTakeOffset && (
                      <div className="absolute left-1 top-1 bottom-1 flex items-center opacity-60 group-hover/take:opacity-100 pointer-events-none">
                        <MoveHorizontal className="w-3 h-3 text-emerald-300" />
                      </div>
                    )}

                    {/* Render Waveform Bars */}
                    {latestTake.waveformData && latestTake.waveformData.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-between gap-[1px] pl-3 pointer-events-none">
                        {latestTake.waveformData.map((val, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${Math.max(10, val * 100)}%` }}
                            className={`w-1 rounded-full ${
                              latestTake.muted ? 'bg-zinc-600' : 'bg-emerald-400'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pl-3 pointer-events-none">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Dubbed Take ({latestTake.duration.toFixed(1)}s)</span>
                      </div>
                    )}

                    {/* Drag Offset Pill / Tooltip */}
                    {isThisTakeDragging && (
                      <div className="absolute top-0 right-1 bg-zinc-950/90 text-emerald-300 border border-emerald-500/50 px-1 py-0.2 rounded text-[9px] font-mono font-bold shadow-md pointer-events-none">
                        {currentTakeOffset.toFixed(2)}s
                      </div>
                    )}

                    {/* VAD Speech Highlights */}
                    {latestTake.vadSegments &&
                      latestTake.vadSegments.map((seg, sIdx) => {
                        const segLeft = (seg.start / latestTake.duration) * 100;
                        const segWidth = ((seg.end - seg.start) / latestTake.duration) * 100;
                        return (
                          <div
                            key={sIdx}
                            style={{ left: `${segLeft}%`, width: `${segWidth}%` }}
                            className="absolute top-0 bottom-0 bg-emerald-400/20 border-b-2 border-emerald-400 pointer-events-none"
                            title={`Speech: ${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s`}
                          />
                        );
                      })}
                  </div>
                )}

                {/* Playhead Needle */}
                <div
                  style={{ left: `${(currentTime / effectiveDuration) * 100}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-30 pointer-events-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
