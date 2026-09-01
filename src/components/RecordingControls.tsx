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
    <div id="recording-controls" className="w-full bg-zinc-900/95 rounded-2xl border border-zinc-800/90 p-4 shadow-xl flex flex-col gap-3.5">
      {/* Top Row: Character & Voice FX on Left, Settings & Meter Toolbar on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/70">
        {/* Left: Active Character / Actor Selector & Voice Modifier */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20 shrink-0"
            style={{ backgroundColor: activeChar?.color || '#f97316' }}
          >
            {activeChar?.avatarIcon || '🎭'}
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Recording Take For:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="recording-character-select"
                value={activeRecordingCharacterId}
                onChange={(e) => onSelectRecordingCharacter(e.target.value)}
                disabled={isRecording}
                className="bg-zinc-950 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-1 text-xs font-black text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer max-w-[170px] truncate"
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

              {/* Attached Real-Time Voice Modifier */}
              {onChangeVoiceEffect && (
                <select
                  id="recording-voice-effect-select"
                  value={activeVoiceEffect || 'none'}
                  onChange={(e) => onChangeVoiceEffect(e.target.value as VoiceEffect)}
                  disabled={isRecording}
                  className="bg-zinc-950 border border-amber-500/50 hover:border-amber-400 rounded-xl px-2.5 py-1 text-xs font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
                  title="Voice modifier applied in real-time to your microphone take"
                >
                  <option value="none">🎙️ Clean FX</option>
                  <option value="villain">🦹‍♂️ Movie Villain</option>
                  <option value="chipmunk">🐿️ Chipmunk</option>
                  <option value="robot">🤖 Cyber Robot</option>
                  <option value="radio">📻 Walkie-Talkie</option>
                  <option value="megaphone">📢 Megaphone</option>
                  <option value="reverb">🏛️ Reverb</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Right: VU Meter & Latency Calibration & Ducking Toolbar */}
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          {/* Real-time VU Meter */}
          <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono gap-2">
                <span>MIC</span>
                <span className={vuLevel > 0.75 ? 'text-orange-400 font-bold' : 'text-emerald-400'}>
                  {vuLevel > 0.01 ? `${Math.round(vuLevel * 100)}%` : 'MUTED'}
                </span>
              </div>
              <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
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
          </div>

          {/* 3-2-1 Metronome Lead-in */}
          <button
            id="toggle-countin-btn"
            onClick={onToggleCountIn}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              useCountIn
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle 3-second countdown lead-in"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="text-[11px]">3-2-1 Lead In</span>
          </button>

          {/* Sync Calibration Offset */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 text-[11px] shrink-0">
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
              <option value="0" className="bg-zinc-900">0ms</option>
              <option value="50" className="bg-zinc-900">+50ms</option>
              <option value="100" className="bg-zinc-900">+100ms</option>
              <option value="150" className="bg-zinc-900">+150ms</option>
            </select>
          </div>

          {/* Original Audio Treatment Selector */}
          {onChangeOriginalAudioMode && (
            <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 text-[11px] shrink-0">
              <span className="text-zinc-400">Duck:</span>
              <select
                id="voice-replacement-mode-select"
                value={originalAudioMode}
                onChange={(e) => onChangeOriginalAudioMode(e.target.value as OriginalAudioMode)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                title="Original Audio Treatment: Duck original audio so your voice dub is clear"
              >
                <option value="duck_10" className="bg-zinc-900">🔉 Duck (10%)</option>
                <option value="duck_25" className="bg-zinc-900">🔉 Duck (25%)</option>
                <option value="mute" className="bg-zinc-900">🔇 Mute (0%)</option>
                <option value="keep" className="bg-zinc-900">🔊 Keep (100%)</option>
                <option value="smart_duck" className="bg-zinc-900">⚡ Smart</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: BIG Action Record Button & Target Text */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Active Target Prompt Info */}
        <div className="text-xs text-zinc-400 flex items-center gap-2 truncate text-center sm:text-left">
          <span className="text-[11px] uppercase font-bold text-zinc-500">Target:</span>
          <strong className="text-white font-black">{activeChar?.name}</strong>
          <span>•</span>
          <span className="text-amber-300 font-semibold truncate max-w-xs sm:max-w-md">
            {recordingLineText ? `"${recordingLineText}"` : activeChar?.voiceStyle}
          </span>
        </div>

        {/* Action Button */}
        {isRecording ? (
          <button
            id="stop-recording-btn"
            onClick={onStopRecording}
            className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-950/80 border border-orange-400 animate-pulse transition-all transform hover:scale-105 shrink-0"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Recording (Space)</span>
          </button>
        ) : (
          <button
            id="start-recording-btn"
            onClick={onStartRecording}
            className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-950/80 border border-orange-400/40 transition-all transform hover:scale-105 shrink-0"
          >
            <Mic className="w-4 h-4 animate-bounce-subtle" />
            <span>Record Take (Space)</span>
          </button>
        )}
      </div>
    </div>
  );
};
