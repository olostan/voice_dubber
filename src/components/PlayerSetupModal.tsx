import React, { useState } from 'react';
import { Character, Player, VoiceEffect } from '../types';
import { X, Users, Plus, Trash2, Mic, UserCheck, Shield } from 'lucide-react';

interface PlayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  characters: Character[];
  onSavePlayers: (players: Player[]) => void;
}

const AVATAR_COLORS = [
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const PlayerSetupModal: React.FC<PlayerSetupModalProps> = ({
  isOpen,
  onClose,
  players,
  characters,
  onSavePlayers,
}) => {
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    const nextIdx = localPlayers.length + 1;
    const assignedChar = characters[(nextIdx - 1) % characters.length] || characters[0];
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: `Actor ${nextIdx}`,
      characterId: assignedChar?.id || 'char-1',
      avatarColor: AVATAR_COLORS[(nextIdx - 1) % AVATAR_COLORS.length],
      voiceEffect: 'none',
    };
    setLocalPlayers([...localPlayers, newPlayer]);
  };

  const handleRemovePlayer = (id: string) => {
    if (localPlayers.length <= 1) return;
    setLocalPlayers(localPlayers.filter((p) => p.id !== id));
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setLocalPlayers(
      localPlayers.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleSave = () => {
    onSavePlayers(localPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-['Outfit']">
                Multiplayer Voice Actors Setup
              </h2>
              <p className="text-xs text-zinc-400">
                Configure voice actors, assign script characters, and set default vocal effects.
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

        {/* Players List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {localPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Player Avatar & Name */}
              <div className="flex items-center gap-3 flex-1 w-full">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleUpdatePlayer(player.id, { name: e.target.value })}
                  placeholder="Actor Name"
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1"
                />
              </div>

              {/* Character Assignment & Default Effect */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Character</span>
                  <select
                    value={player.characterId}
                    onChange={(e) => handleUpdatePlayer(player.id, { characterId: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Default FX</span>
                  <select
                    value={player.voiceEffect}
                    onChange={(e) => handleUpdatePlayer(player.id, { voiceEffect: e.target.value as VoiceEffect })}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="none">🎙️ Natural</option>
                    <option value="villain">🦹 Deep Villain</option>
                    <option value="chipmunk">🐿️ Chipmunk</option>
                    <option value="robot">🤖 Robot</option>
                    <option value="radio">📻 Walkie-Talkie</option>
                    <option value="reverb">🏛️ Reverb</option>
                    <option value="megaphone">📢 Megaphone</option>
                  </select>
                </div>

                {localPlayers.length > 1 && (
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-2 mt-3 rounded-xl text-zinc-500 hover:text-orange-400 hover:bg-zinc-800 transition-colors"
                    title="Remove actor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Player Button */}
          {localPlayers.length < 6 && (
            <button
              onClick={handleAddPlayer}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-zinc-700 hover:border-orange-500 text-xs font-bold text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Voice Actor (Up to 6)</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800 bg-zinc-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950/50"
          >
            <UserCheck className="w-4 h-4" />
            <span>Save Voice Actors</span>
          </button>
        </div>
      </div>
    </div>
  );
};
