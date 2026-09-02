import React, { useState, useEffect } from 'react';
import { AudioTake, Character, Player, ScriptData, ScriptLine } from '../types';
import { Sparkles, Plus, Trash2, Edit3, Wand2, Clock, Check, RefreshCw, Mic, AlertCircle, ChevronRight, Users, UserPlus, RotateCcw } from 'lucide-react';

interface ScriptPrompterProps {
  scriptData: ScriptData;
  characters: Character[];
  onUpdateCharacters?: (characters: Character[]) => void;
  players?: Player[];
  onUpdatePlayers?: (players: Player[]) => void;
  audioTakes?: AudioTake[];
  onClearAllTakes?: () => void;
  currentTime: number;
  duration: number;
  onUpdateScriptData: (data: ScriptData) => void;
  onGenerateAiScript: (genre: string, hint: string) => Promise<void>;
  isGeneratingAi: boolean;
  onTranscribeClipAudio?: () => Promise<void>;
  isTranscribingAudio?: boolean;
  transcriptionError?: string | null;
  onClearTranscriptionError?: () => void;
  onSeek?: (time: number) => void;
  onRecordLine?: (line: ScriptLine) => void;
  activeRecordingLineId?: string | null;
  nextPendingLineId?: string | null;
  isRecording?: boolean;
}

const GENRE_PRESETS = [
  'Film Noir Detective',
  'Sci-Fi Space Chaos',
  'Cooking Show Meltdown',
  'Medieval Soap Opera',
  'Wild Nature Documentary',
  'Anime Shonen Battle',
  'Awkward First Date',
  'Extreme Sports Commentary',
  'Action Movie Cliché',
  'Commercial Infomercial',
];

const COLOR_PALETTE = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export const ScriptPrompter: React.FC<ScriptPrompterProps> = ({
  scriptData,
  characters,
  onUpdateCharacters,
  players = [],
  onUpdatePlayers,
  audioTakes = [],
  onClearAllTakes,
  currentTime,
  duration,
  onUpdateScriptData,
  onGenerateAiScript,
  isGeneratingAi,
  onTranscribeClipAudio,
  isTranscribingAudio,
  transcriptionError,
  onClearTranscriptionError,
  onSeek,
  onRecordLine,
  activeRecordingLineId,
  nextPendingLineId,
  isRecording = false,
}) => {
  const [selectedGenre, setSelectedGenre] = useState('Film Noir Detective');
  const [customHint, setCustomHint] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAiWriter, setShowAiWriter] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(scriptData.scriptTitle);

  useEffect(() => {
    setTitleInput(scriptData.scriptTitle);
  }, [scriptData.scriptTitle]);

  const handleLineChange = (id: string, field: keyof ScriptLine, value: any) => {
    const updatedLines = scriptData.lines.map((line) => {
      if (line.id === id) {
        return { ...line, [field]: value };
      }
      return line;
    });
    onUpdateScriptData({ ...scriptData, lines: updatedLines });
  };

  const handleAddLine = () => {
    const defaultSpeaker = characters[0] || { id: 'char-1', name: 'Actor 1' };
    const lastLine = scriptData.lines[scriptData.lines.length - 1];
    const newStart = lastLine ? Math.min(Math.max(0, duration - 1), lastLine.endTime + 0.5) : 0.5;
    const newEnd = Math.min(duration, newStart + 3.0);

    const newLine: ScriptLine = {
      id: `line-${Date.now()}`,
      speakerId: defaultSpeaker.id,
      speakerName: defaultSpeaker.name,
      startTime: parseFloat(newStart.toFixed(1)),
      endTime: parseFloat(newEnd.toFixed(1)),
      text: 'New dialogue line...',
      cue: 'Dramatic delivery',
    };

    onUpdateScriptData({
      ...scriptData,
      lines: [...scriptData.lines, newLine],
    });
  };

  const handleDeleteLine = (id: string) => {
    onUpdateScriptData({
      ...scriptData,
      lines: scriptData.lines.filter((l) => l.id !== id),
    });
  };

  const handleAddCharacter = () => {
    if (!onUpdateCharacters) return;
    const nextIdx = characters.length + 1;
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: `Character ${nextIdx}`,
      voiceStyle: 'Expressive voice',
      color: COLOR_PALETTE[(nextIdx - 1) % COLOR_PALETTE.length],
      avatarIcon: '🎭',
    };
    const updated = [...characters, newChar];
    onUpdateCharacters(updated);

    if (onUpdatePlayers) {
      const newPlayer: Player = {
        id: `p-${Date.now()}`,
        name: `Actor ${nextIdx}`,
        characterId: newChar.id,
        avatarColor: newChar.color,
        voiceEffect: 'none',
      };
      onUpdatePlayers([...players, newPlayer]);
    }
  };

  const handleUpdateCharacter = (charId: string, updates: Partial<Character>) => {
    if (!onUpdateCharacters) return;
    const updated = characters.map((c) => (c.id === charId ? { ...c, ...updates } : c));
    onUpdateCharacters(updated);

    // Also update matching speakerName in script lines if name changed
    if (updates.name) {
      const updatedLines = scriptData.lines.map((l) =>
        l.speakerId === charId ? { ...l, speakerName: updates.name! } : l
      );
      onUpdateScriptData({ ...scriptData, lines: updatedLines });
    }
  };

  const handleDeleteCharacter = (charId: string) => {
    if (!onUpdateCharacters || characters.length <= 1) return;
    const updated = characters.filter((c) => c.id !== charId);
    onUpdateCharacters(updated);
    if (onUpdatePlayers) {
      onUpdatePlayers(players.filter((p) => p.characterId !== charId));
    }
  };

  const hasLines = scriptData.lines.length > 0;

  return (
    <div id="script-prompter-container" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Mic className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
              Dialogue Teleprompter & Script
            </h3>
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  id="script-title-rename-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => {
                    const trimmed = titleInput.trim();
                    if (trimmed && trimmed !== scriptData.scriptTitle) {
                      onUpdateScriptData({ ...scriptData, scriptTitle: trimmed });
                    }
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = titleInput.trim();
                      if (trimmed && trimmed !== scriptData.scriptTitle) {
                        onUpdateScriptData({ ...scriptData, scriptTitle: trimmed });
                      }
                      setIsEditingTitle(false);
                    }
                    if (e.key === 'Escape') {
                      setTitleInput(scriptData.scriptTitle);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="bg-zinc-950 text-white font-bold text-[11px] px-2 py-0.5 rounded border border-orange-500 focus:outline-none max-w-[180px]"
                />
              </div>
            ) : (
              <button
                id="rename-script-title-btn"
                onClick={() => {
                  setTitleInput(scriptData.scriptTitle);
                  setIsEditingTitle(true);
                }}
                className="text-[11px] font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded-lg border border-zinc-700 hover:border-zinc-600 flex items-center gap-1 group transition-all"
                title="Click to rename script"
              >
                <span>{scriptData.scriptTitle || 'Scene Dialogue'}</span>
                <Edit3 className="w-2.5 h-2.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </button>
            )}
            {characters.length > 0 && (
              <span className="text-[11px] font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{characters.length} Voice Actor{characters.length > 1 ? 's' : ''} / Tracks</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {hasLines 
              ? 'Timed dialogue cues synchronized to the video. Lines highlight as the playhead advances.'
              : 'Transcribe spoken audio from the video or generate a comedy parody script.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {audioTakes.length > 0 && onClearAllTakes && (
            <button
              id="clear-all-takes-btn"
              onClick={onClearAllTakes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/30 hover:bg-red-950/60 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Clear all recorded voice dubs to re-record everything from the beginning"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>Clear All Dubs ({audioTakes.length})</span>
            </button>
          )}

          <button
            id="toggle-edit-script-btn"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isEditing
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Edit script lines, timing, and voice actors"
          >
            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Done Editing' : 'Edit Script & Actors'}</span>
          </button>
        </div>
      </div>

      {/* Voice Actors & Characters Roster */}
      {characters.length > 0 && (
        <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/70 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span>Voice Actors & Characters ({characters.length})</span>
            </div>
            {isEditing && onUpdateCharacters && (
              <button
                id="add-character-btn"
                onClick={handleAddCharacter}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/30 transition-all"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add Voice Actor</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {characters.map((c) => {
              const assignedPlayer = players.find((p) => p.characterId === c.id);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 shadow-sm"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: c.color }}
                  />
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleUpdateCharacter(c.id, { name: e.target.value })}
                        className="bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs font-bold text-white w-28"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={c.voiceStyle || ''}
                        onChange={(e) => handleUpdateCharacter(c.id, { voiceStyle: e.target.value })}
                        className="bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-amber-300 w-24 italic"
                        placeholder="Voice style"
                      />
                      {characters.length > 1 && (
                        <button
                          onClick={() => handleDeleteCharacter(c.id)}
                          className="text-zinc-500 hover:text-orange-400 p-0.5"
                          title="Remove voice character track"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="font-extrabold text-white">{c.name}</span>
                      {assignedPlayer && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {assignedPlayer.name}
                        </span>
                      )}
                      {assignedPlayer?.voiceEffect && assignedPlayer.voiceEffect !== 'none' && (
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                          FX: {assignedPlayer.voiceEffect}
                        </span>
                      )}
                      {c.voiceStyle && (
                        <span className="text-[10px] text-amber-300/80 italic">
                          ({c.voiceStyle})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Persistent Transcription Error Alert with 1-Click Retry */}
      {transcriptionError && (
        <div
          id="transcription-error-banner"
          className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-100">Transcription Notice</p>
              <p className="text-xs text-red-300/90 mt-0.5">{transcriptionError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onTranscribeClipAudio && (
              <button
                onClick={onTranscribeClipAudio}
                disabled={isTranscribingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTranscribingAudio ? 'animate-spin' : ''}`} />
                <span>Retry Now</span>
              </button>
            )}
            {onClearTranscriptionError && (
              <button
                onClick={onClearTranscriptionError}
                className="p-1 text-xs text-red-400 hover:text-white"
                title="Dismiss notice"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Toolbar: Transcribe Button & AI Scriptwriter Dropdown */}
      <div className="flex flex-col gap-2.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Audio Transcription Button */}
          {onTranscribeClipAudio && (
            <button
              id="transcribe-audio-btn"
              onClick={onTranscribeClipAudio}
              disabled={isTranscribingAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-950/40 border border-orange-400/40 transition-all disabled:opacity-50"
              title="Transcribe spoken dialogue from the clip and assign character tracks"
            >
              {isTranscribingAudio ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>{isTranscribingAudio ? 'Transcribing Speech...' : hasLines ? 'Re-Transcribe & Split Tracks' : 'Transcribe Audio & Split Tracks'}</span>
            </button>
          )}

          {/* Toggle AI Scriptwriter tools */}
          <button
            id="toggle-ai-writer-btn"
            onClick={() => setShowAiWriter(!showAiWriter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showAiWriter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Parody Scriptwriter</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAiWriter ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Collapsible AI Parody Script Controls */}
        {showAiWriter && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>Genre:</span>
            </div>
            <select
              id="ai-genre-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              {GENRE_PRESETS.map((g) => (
                <option key={g} value={g} className="bg-zinc-900">
                  {g}
                </option>
              ))}
            </select>

            <input
              id="ai-custom-hint-input"
              type="text"
              placeholder="Topic or hint (e.g. 'fighting over a pizza')..."
              value={customHint}
              onChange={(e) => setCustomHint(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 flex-1 min-w-[140px] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />

            <button
              id="generate-ai-script-btn"
              onClick={() => onGenerateAiScript(selectedGenre, customHint)}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-md shadow-amber-950/50 transition-all disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingAi ? 'Writing Script...' : 'Generate Script'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Script Lines List / Teleprompter Flow */}
      <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
        {hasLines ? (
          scriptData.lines.map((line) => {
            const char = characters.find((c) => c.id === line.speakerId);
            const assignedPlayer = players.find((p) => p.characterId === line.speakerId);
            const isCurrentlyActive = currentTime >= line.startTime && currentTime <= line.endTime;
            const hasRecordedTake = audioTakes.some(
              (t) =>
                t.lineId === line.id ||
                (t.characterId === line.speakerId &&
                  t.startTimeOffset <= line.endTime + 0.25 &&
                  t.startTimeOffset + t.duration >= line.startTime - 0.25)
            );
            const isRecordingThisLine = activeRecordingLineId === line.id && isRecording;
            const isNextPending = nextPendingLineId === line.id;

            return (
              <div
                key={line.id}
                onClick={() => {
                  if (!isEditing && onSeek) {
                    onSeek(line.startTime);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                  !isEditing ? 'cursor-pointer hover:shadow-lg hover:border-zinc-700' : ''
                } ${
                  isRecordingThisLine
                    ? 'border-red-500 bg-red-950/50 shadow-xl shadow-red-950/60 ring-2 ring-red-500'
                    : isCurrentlyActive
                    ? 'border-orange-500 bg-orange-950/40 shadow-lg shadow-orange-950/40 ring-2 ring-orange-500'
                    : isNextPending && !isRecording
                    ? 'border-amber-500/50 bg-zinc-950/90 shadow-md ring-1 ring-amber-500/30'
                    : hasRecordedTake
                    ? 'border-emerald-500/30 bg-zinc-950/80 hover:border-emerald-500/50'
                    : 'border-zinc-800/90 bg-zinc-950/80'
                }`}
              >
                {/* Header Row: Speaker Name & Timing on Left, Record/Actions on Right */}
                <div className="flex items-center justify-between gap-2 w-full flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: char?.color || '#f97316' }}
                    />
                    {isEditing ? (
                      <select
                        value={line.speakerId}
                        onChange={(e) => {
                          const sel = characters.find((c) => c.id === e.target.value);
                          handleLineChange(line.id, 'speakerId', e.target.value);
                          if (sel) handleLineChange(line.id, 'speakerName', sel.name);
                        }}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-white px-2 py-1"
                      >
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-white">{line.speakerName}</span>
                        {assignedPlayer?.voiceEffect && assignedPlayer.voiceEffect !== 'none' && (
                          <span className="text-[9px] font-mono font-bold text-amber-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                            FX: {assignedPlayer.voiceEffect}
                          </span>
                        )}
                        {isRecordingThisLine && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-red-300 bg-red-500/30 px-2 py-0.5 rounded-full border border-red-500/50 animate-pulse">
                            ● Recording
                          </span>
                        )}
                        {isNextPending && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-500/50 animate-pulse">
                            👉 Next Up
                          </span>
                        )}
                        {hasRecordedTake && !isRecordingThisLine && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Dubbed</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timing Badge */}
                    <div className="flex items-center gap-1 bg-zinc-900/90 px-2.5 py-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
                      <Clock className="w-3 h-3 text-orange-400" />
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={line.startTime}
                            onChange={(e) => handleLineChange(line.id, 'startTime', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1 text-white"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            step="0.5"
                            value={line.endTime}
                            onChange={(e) => handleLineChange(line.id, 'endTime', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-zinc-950 border border-zinc-700 rounded px-1 text-white"
                          />
                        </div>
                      ) : (
                        <span>
                          {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Record Button */}
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLine(line.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      onRecordLine && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordLine(line);
                          }}
                          disabled={isRecording}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                            isRecordingThisLine
                              ? 'bg-red-600 text-white animate-pulse'
                              : isNextPending
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 ring-2 ring-amber-400 hover:from-amber-400 hover:to-orange-400'
                              : hasRecordedTake
                              ? 'bg-emerald-950/70 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400'
                              : 'bg-zinc-900 hover:bg-orange-500 text-zinc-200 hover:text-white border border-zinc-700 hover:border-orange-400'
                          }`}
                          title={`Record line for ${line.speakerName}`}
                        >
                          {hasRecordedTake ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mic className="w-3.5 h-3.5" />}
                          <span>{hasRecordedTake ? 'Re-record' : 'Record Line'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Main Body: Full Width Dialogue Text & Acting Cue */}
                <div className="w-full">
                  {isEditing ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleLineChange(line.id, 'text', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        placeholder="Dialogue line..."
                      />
                      <input
                        type="text"
                        placeholder="Acting cue (e.g. whispered, sarcastic)..."
                        value={line.cue || ''}
                        onChange={(e) => handleLineChange(line.id, 'cue', e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-amber-300 italic focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <p className={`text-sm sm:text-base font-bold leading-relaxed tracking-wide ${
                        isCurrentlyActive ? 'text-orange-200' : 'text-zinc-100'
                      }`}>
                        "{line.text}"
                      </p>
                      {line.cue && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-amber-300/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 italic">
                            🎭 [{line.cue}]
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-2">
            <Mic className="w-8 h-8 text-orange-400/50" />
            <p className="text-xs font-bold text-zinc-300">No Dialogue Lines Yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm">
              Click <strong className="text-zinc-300">"Transcribe Audio & Split Tracks"</strong> above to extract dialogue from this video, or use the <strong className="text-zinc-300">"AI Parody Scriptwriter"</strong> to generate a custom comedy dub.
            </p>
          </div>
        )}
      </div>

      {/* Add Line button in Edit Mode */}
      {isEditing && (
        <button
          onClick={handleAddLine}
          className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dialogue Line</span>
        </button>
      )}
    </div>
  );
};
