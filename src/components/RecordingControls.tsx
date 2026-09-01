import React from 'react';
import { Character, OriginalAudioMode, Player, VoiceEffect } from '../types';
import { Mic, Square, Sparkles, Clock, Sliders, Bell, UserCheck } from 'lucide-react';

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
  activeVoiceEffect: VoiceEffect;
  onChangeVoiceEffect: (effect: VoiceEffect) => void;
  originalAudioMode?: OriginalAudioMode;
  onChangeOriginalAudioMode?: (mode: OriginalAudioMode) => void;
  recordingLineText?: string | null;
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
  activeVoiceEffect,
  onChangeVoiceEffect,
  originalAudioMode = 'duck_10',
  onChangeOriginalAudioMode,
  recordingLineText,
}) => {
  const activeChar = characters.find((c) => c.id === activeRecordingCharacterId) || characters[0];
  const activePlayer = players.find((p) => p.characterId === activeChar?.id) || players[0];

  return (
    <div id="recording-controls" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Active Character / Actor Selector */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20 shrink-0"
          style={{ backgroundColor: activeChar?.color || '#f97316' }}
        >
          {activeChar?.avatarIcon || '🎭'}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="recording-character-select" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Recording Take For:
          </label>
          <select
            id="recording-character-select"
            value={activeRecordingCharacterId}
            onChange={(e) => onSelectRecordingCharacter(e.target.value)}
            disabled={isRecording}
            className="bg-zinc-950 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-1.5 text-xs font-extrabold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {characters.map((c) => {
              const assigned = players.find((p) => p.characterId === c.id);
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({assigned?.name || 'Unassigned'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Center: BIG Record / Stop Action Button */}
      <div className="flex flex-col items-center gap-1.5 w-full md:w-auto">
        {isRecording ? (
          <button
            id="stop-recording-btn"
            onClick={onStopRecording}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-950/80 border border-orange-400 animate-pulse transition-all transform hover:scale-105"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Recording (Space)</span>
          </button>
        ) : (
          <button
            id="start-recording-btn"
            onClick={onStartRecording}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-950/80 border border-orange-400/40 transition-all transform hover:scale-105"
          >
            <Mic className="w-5 h-5 animate-bounce-subtle" />
            <span>Record Take (Space)</span>
          </button>
        )}

        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 max-w-sm truncate">
          <span>Target: <strong className="text-zinc-200">{activeChar?.name}</strong></span>
          <span>•</span>
          <span className="text-amber-400 font-semibold truncate">
            {recordingLineText ? `"${recordingLineText}"` : activeChar?.voiceStyle}
          </span>
        </div>
      </div>

      {/* Right: VU Meter & Latency Calibration */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        {/* Real-time VU Meter */}
        <div className="flex flex-col gap-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 min-w-[130px]">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>MIC LEVEL</span>
            <span className={vuLevel > 0.75 ? 'text-orange-400 font-bold' : 'text-emerald-400'}>
              {vuLevel > 0.01 ? `${Math.round(vuLevel * 100)}%` : 'MUTED'}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            <div
              style={{ width: `${Math.min(100, vuLevel * 100)}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                vuLevel > 0.75
                  ? 'bg-orange-500 shadow-sm shadow-orange-500'
                  : vuLevel > 0.4
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
        </div>

        {/* Count-in Toggle & Latency Offset */}
        <div className="flex items-center gap-2">
          {/* 3-2-1 Metronome Lead-in */}
          <button
            id="toggle-countin-btn"
            onClick={onToggleCountIn}
            className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              useCountIn
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle 3-second countdown lead-in"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="text-[11px]">3-2-1 Lead In</span>
          </button>

          {/* Sync Calibration Offset */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Sync:</span>
            <select
              id="latency-offset-select"
              value={latencyOffsetMs}
              onChange={(e) => onChangeLatencyOffset(parseInt(e.target.value, 10))}
              className="bg-transparent text-zinc-200 font-bold focus:outline-none cursor-pointer"
              title="Mic latency delay offset"
            >
              <option value="-150" className="bg-zinc-900">-150ms</option>
              <option value="-100" className="bg-zinc-900">-100ms</option>
              <option value="-50" className="bg-zinc-900">-50ms</option>
              <option value="0" className="bg-zinc-900">0ms (Default)</option>
              <option value="50" className="bg-zinc-900">+50ms</option>
              <option value="100" className="bg-zinc-900">+100ms</option>
              <option value="150" className="bg-zinc-900">+150ms</option>
            </select>
          </div>

          {/* Original Audio Treatment Selector */}
          {onChangeOriginalAudioMode && (
            <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-[11px]">
              <span className="text-zinc-400">Duck:</span>
              <select
                id="voice-replacement-mode-select"
                value={originalAudioMode}
                onChange={(e) => onChangeOriginalAudioMode(e.target.value as OriginalAudioMode)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                title="Original Audio Treatment: Duck original audio so your voice dub is clear"
              >
                <option value="duck_10" className="bg-zinc-900">🔉 Duck (10% - Default)</option>
                <option value="duck_25" className="bg-zinc-900">🔉 Duck (25% Ambience)</option>
                <option value="mute" className="bg-zinc-900">🔇 Mute (0% - Voice Dub)</option>
                <option value="keep" className="bg-zinc-900">🔊 Keep (100% Original)</option>
                <option value="smart_duck" className="bg-zinc-900">⚡ Smart Ducking</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
