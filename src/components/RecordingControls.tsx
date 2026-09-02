import React from 'react';
import { Character, OriginalAudioMode, Player, ScriptLine, VoiceEffect } from '../types';
import { Mic, Square, Sparkles, Clock, Sliders, Bell, UserCheck, VolumeX, ShieldCheck, Zap } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  characters: Character[];
  players: Player[];
  activeRecordingCharacterId: string;
  onSelectRecordingCharacter: (id: string) => void;
  vuLevel: number;
  latencyOffsetMs: number;
  onChangeLatencyOffset: (ms: number) => void;
  useCountIn: boolean;
  onToggleCountIn: () => void;
  muteDuringRecording?: boolean;
  onToggleMuteDuringRecording?: () => void;
  activeVoiceEffect: VoiceEffect;
  onChangeVoiceEffect: (effect: VoiceEffect) => void;
  originalAudioMode?: OriginalAudioMode;
  onChangeOriginalAudioMode?: (mode: OriginalAudioMode) => void;
  recordingLine?: ScriptLine | null;
  currentTime?: number;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  characters,
  players,
  activeRecordingCharacterId,
  onSelectRecordingCharacter,
  vuLevel,
  latencyOffsetMs,
  onChangeLatencyOffset,
  useCountIn,
  onToggleCountIn,
  muteDuringRecording = true,
  onToggleMuteDuringRecording,
  activeVoiceEffect,
  onChangeVoiceEffect,
  originalAudioMode = 'duck_5',
  onChangeOriginalAudioMode,
  recordingLine,
  currentTime = 0,
}) => {
  const activeChar = characters.find((c) => c.id === activeRecordingCharacterId) || characters[0];
  const activePlayer = players.find((p) => p.characterId === activeChar?.id) || players[0];

  // Progress Bar & Overtime calculations for active line
  const lineStart = recordingLine ? recordingLine.startTime : 0;
  const lineEnd = recordingLine ? recordingLine.endTime : 0;
  const lineDur = Math.max(0.5, lineEnd - lineStart);
  const elapsed = currentTime - lineStart;
  const isPreRoll = isRecording && recordingLine && elapsed < -0.05;
  const isOvertime = isRecording && recordingLine && elapsed > lineDur + 0.05;
  const progressPct = Math.min(100, Math.max(0, (elapsed / lineDur) * 100));

  return (
    <div id="recording-controls" className="w-full bg-zinc-900/95 rounded-2xl border border-zinc-800/90 p-3 shadow-xl flex flex-col gap-2.5 font-['Plus_Jakarta_Sans']">
      {/* Single Consolidated Master Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Character & Voice FX */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-md border border-white/20 shrink-0"
            style={{ backgroundColor: activeChar?.color || '#f97316' }}
          >
            {activeChar?.avatarIcon || '🎭'}
          </div>

          <select
            id="recording-character-select"
            value={activeRecordingCharacterId}
            onChange={(e) => onSelectRecordingCharacter(e.target.value)}
            disabled={isRecording}
            className="bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-2.5 py-1 text-xs font-black text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer max-w-[140px] truncate"
            title="Active voice character being dubbed"
          >
            {characters.map((c) => {
              const assigned = players.find((p) => p.characterId === c.id);
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({assigned?.name || 'Actor'})
                </option>
              );
            })}
          </select>

          {onChangeVoiceEffect && (
            <select
              id="recording-voice-effect-select"
              value={activeVoiceEffect || 'none'}
              onChange={(e) => onChangeVoiceEffect(e.target.value as VoiceEffect)}
              disabled={isRecording}
              className="bg-zinc-950 border border-amber-500/50 hover:border-amber-400 rounded-xl px-2 py-1 text-xs font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
              title="Voice modifier applied in real-time to your microphone take"
            >
              <option value="none">🎙️ Clean FX</option>
              <option value="villain">🦹‍♂️ Villain</option>
              <option value="chipmunk">🐿️ Chipmunk</option>
              <option value="robot">🤖 Robot</option>
              <option value="radio">📻 Radio</option>
              <option value="megaphone">📢 Megaphone</option>
              <option value="reverb">🏛️ Reverb</option>
            </select>
          )}
        </div>

        {/* Center: Compact Hardware & Sync Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* VU Meter */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 shrink-0">
            <span className="text-[9px] text-zinc-400 font-mono font-bold">MIC</span>
            <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, vuLevel * 100)}%` }}
                className={`h-full rounded-full transition-all duration-75 ${
                  vuLevel > 0.75 ? 'bg-orange-500' : vuLevel > 0.4 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </div>
          </div>

          {/* Mute Speakers on Record */}
          {onToggleMuteDuringRecording && (
            <button
              id="toggle-mute-rec-btn"
              onClick={onToggleMuteDuringRecording}
              className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                muteDuringRecording
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title="Mute speakers during recording to eliminate mic bleed & echo"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Mute Spk: {muteDuringRecording ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* 3-2-1 Lead-in */}
          <button
            id="toggle-countin-btn"
            onClick={onToggleCountIn}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              useCountIn
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle 3-second countdown lead-in"
          >
            <Bell className="w-3 h-3" />
            <span>3-2-1</span>
          </button>

          {/* Sync Offset */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 text-[11px] shrink-0">
            <Clock className="w-3 h-3 text-zinc-400" />
            <select
              id="latency-offset-select"
              value={latencyOffsetMs}
              onChange={(e) => onChangeLatencyOffset(parseInt(e.target.value, 10))}
              className="bg-transparent text-zinc-200 font-bold focus:outline-none cursor-pointer"
              title="Mic latency delay offset"
            >
              <option value="-100" className="bg-zinc-900">-100ms</option>
              <option value="-50" className="bg-zinc-900">-50ms</option>
              <option value="0" className="bg-zinc-900">0ms</option>
              <option value="50" className="bg-zinc-900">+50ms</option>
              <option value="100" className="bg-zinc-900">+100ms</option>
            </select>
          </div>

          {/* Audio Ducking Mode */}
          {onChangeOriginalAudioMode && (
            <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 text-[11px] shrink-0">
              <select
                id="voice-replacement-mode-select"
                value={originalAudioMode}
                onChange={(e) => onChangeOriginalAudioMode(e.target.value as OriginalAudioMode)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                title="Original Audio Treatment"
              >
                <option value="duck_5" className="bg-zinc-900">Duck (5%)</option>
                <option value="duck_10" className="bg-zinc-900">Duck (10%)</option>
                <option value="duck_25" className="bg-zinc-900">Duck (25%)</option>
                <option value="mute" className="bg-zinc-900">Mute (0%)</option>
                <option value="keep" className="bg-zinc-900">Keep (100%)</option>
                <option value="smart_duck" className="bg-zinc-900">Smart Duck</option>
              </select>
            </div>
          )}
        </div>

        {/* Right: Record Action Button */}
        <div className="shrink-0">
          {isRecording ? (
            <button
              id="stop-recording-btn"
              onClick={onStopRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950 border border-orange-400 animate-pulse transition-all transform hover:scale-102 shrink-0 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop (Space)</span>
            </button>
          ) : (
            <button
              id="start-recording-btn"
              onClick={onStartRecording}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950 border border-orange-400/40 transition-all transform hover:scale-102 shrink-0 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 animate-bounce-subtle" />
              <span>Record Take (Space)</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Bottom Row: Live Line Dubbing Progress Bar (during recording) OR Target Line Cue */}
      {isRecording && recordingLine ? (
        <div className="w-full bg-zinc-950/90 border border-orange-500/40 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-inner animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {isPreRoll ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/40 flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 text-sky-400 fill-current" />
                  <span>1s Lead-in • Ready in {Math.abs(elapsed).toFixed(1)}s</span>
                </span>
              ) : isOvertime ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/25 px-2 py-0.5 rounded-full border border-rose-500/50 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Overtime: +{(elapsed - lineDur).toFixed(1)}s (Speaking)</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 animate-pulse">
                  <Mic className="w-3 h-3 text-amber-400" />
                  <span>Dubbing Live Line</span>
                </span>
              )}

              <span className="text-xs font-black text-white truncate max-w-xs sm:max-w-md">
                "{recordingLine.text}"
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className={isOvertime ? 'text-rose-400 font-black' : isPreRoll ? 'text-sky-300' : 'text-amber-300'}>
                {isPreRoll ? `-` : `${Math.max(0, elapsed).toFixed(1)}s`}
              </span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{lineDur.toFixed(1)}s</span>
            </div>
          </div>

          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative p-0.5 border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isOvertime
                  ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 shadow-md shadow-rose-500/50 animate-pulse'
                  : isPreRoll
                  ? 'bg-sky-400 shadow-sm shadow-sky-500/50'
                  : 'bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 shadow-sm shadow-amber-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, isPreRoll ? 15 : progressPct))}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-0.5 border-t border-zinc-800/60 truncate">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Target:</span>
            <strong className="text-white font-bold">{activeChar?.name}</strong>
            <span>•</span>
            <span className="text-amber-300/90 font-medium truncate max-w-xs sm:max-w-lg">
              {recordingLine ? `"${recordingLine.text}"` : activeChar?.voiceStyle}
            </span>
          </div>
          {recordingLine?.cue && (
            <span className="text-[10px] text-zinc-400 italic hidden sm:inline shrink-0">
              [{recordingLine.cue}]
            </span>
          )}
        </div>
      )}
    </div>
  );
};
