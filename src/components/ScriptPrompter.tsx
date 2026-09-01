import React, { useState } from 'react';
import { Character, Player, ScriptData, ScriptLine } from '../types';
import { Sparkles, Plus, Trash2, Edit3, Wand2, Clock, Check, RefreshCw, Mic, AlertCircle, ChevronRight, Users, UserPlus } from 'lucide-react';

interface ScriptPrompterProps {
  scriptData: ScriptData;
  characters: Character[];
  onUpdateCharacters?: (characters: Character[]) => void;
  players?: Player[];
  onUpdatePlayers?: (players: Player[]) => void;
  currentTime: number;
  duration: number;
  onUpdateScriptData: (data: ScriptData) => void;
  onGenerateAiScript: (genre: string, hint: string) => Promise<void>;
  isGeneratingAi: boolean;
  onTranscribeClipAudio?: () => Promise<void>;
  isTranscribingAudio?: boolean;
  transcriptionError?: string | null;
  onClearTranscriptionError?: () => void;
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
  currentTime,
  duration,
  onUpdateScriptData,
  onGenerateAiScript,
  isGeneratingAi,
  onTranscribeClipAudio,
  isTranscribingAudio,
  transcriptionError,
  onClearTranscriptionError,
}) => {
  const [selectedGenre, setSelectedGenre] = useState('Film Noir Detective');
  const [customHint, setCustomHint] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAiWriter, setShowAiWriter] = useState(false);

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
            {scriptData.scriptTitle && (
              <span className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700">
                {scriptData.scriptTitle}
              </span>
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

        {/* Edit Mode Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="toggle-edit-script-btn"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
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
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold text-white">{c.name}</span>
                      {assignedPlayer && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {assignedPlayer.name}
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
      <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {hasLines ? (
          scriptData.lines.map((line) => {
            const char = characters.find((c) => c.id === line.speakerId);
            const isCurrentlyActive = currentTime >= line.startTime && currentTime <= line.endTime;
            const isPast = currentTime > line.endTime;

            return (
              <div
                key={line.id}
                className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isCurrentlyActive
                    ? 'border-orange-500 bg-orange-950/30 shadow-lg shadow-orange-950/40 ring-1 ring-orange-500 scale-[1.01]'
                    : isPast
                    ? 'border-zinc-800/60 bg-zinc-950/40 opacity-70'
                    : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                }`}
              >
                {/* Left Column: Speaker & Timing */}
                <div className="flex items-center gap-2.5 shrink-0">
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
                    <span className="text-xs font-extrabold text-white">{line.speakerName}</span>
                  )}

                  {/* Timing Badge */}
                  <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500" />
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

                {/* Center: Dialogue Text & Acting Cue */}
                <div className="flex-1 flex flex-col gap-1 w-full">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleLineChange(line.id, 'text', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Acting cue..."
                        value={line.cue || ''}
                        onChange={(e) => handleLineChange(line.id, 'cue', e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-0.5 text-[11px] text-amber-300 italic"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">"{line.text}"</span>
                      {line.cue && (
                        <span className="text-[11px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25 italic">
                          {line.cue}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Delete button in edit mode */}
                {isEditing && (
                  <button
                    onClick={() => handleDeleteLine(line.id)}
                    className="p-1 rounded text-zinc-500 hover:text-orange-400"
                    title="Delete line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
