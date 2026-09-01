import React, { useEffect, useState } from 'react';
import { playSoundEffect } from '../utils/audioEngine';
import { Volume2, Zap, Sparkles } from 'lucide-react';

interface SoundItem {
  id: string;
  name: string;
  key: string;
  emoji: string;
  type: string;
  color: string;
}

const SOUNDS: SoundItem[] = [
  { id: 's1', name: 'Vine Boom', key: '1', emoji: '💥', type: 'vine_boom', color: 'hover:border-rose-500 hover:bg-rose-950/30' },
  { id: 's2', name: 'Rimshot', key: '2', emoji: '🥁', type: 'rimshot', color: 'hover:border-amber-500 hover:bg-amber-950/30' },
  { id: 's3', name: 'Airhorn', key: '3', emoji: '📢', type: 'airhorn', color: 'hover:border-yellow-500 hover:bg-yellow-950/30' },
  { id: 's4', name: 'Dun Dun Dun', key: '4', emoji: '😱', type: 'dramatic', color: 'hover:border-purple-500 hover:bg-purple-950/30' },
  { id: 's5', name: 'Applause', key: '5', emoji: '👏', type: 'applause', color: 'hover:border-emerald-500 hover:bg-emerald-950/30' },
  { id: 's6', name: 'Cartoon Boing', key: '6', emoji: '🌀', type: 'boing', color: 'hover:border-cyan-500 hover:bg-cyan-950/30' },
  { id: 's7', name: 'Laser Pew', key: '7', emoji: '⚡', type: 'laser', color: 'hover:border-sky-500 hover:bg-sky-950/30' },
  { id: 's8', name: 'Scratch', key: '8', emoji: '💨', type: 'scratch', color: 'hover:border-orange-500 hover:bg-orange-950/30' },
  { id: 's9', name: 'Gasp', key: '9', emoji: '🫢', type: 'gasp', color: 'hover:border-pink-500 hover:bg-pink-950/30' },
];

export const Soundboard: React.FC = () => {
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);

  const triggerSound = (sound: SoundItem) => {
    playSoundEffect(sound.type, 0.85);
    setActiveSoundId(sound.id);
    setTimeout(() => setActiveSoundId(null), 300);
  };

  // Keyboard shortcut listener (keys 1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const sound = SOUNDS.find((s) => s.key === e.key);
      if (sound) {
        e.preventDefault();
        triggerSound(sound);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div id="soundboard-container" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
            Live Party Soundboard
          </h3>
          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            Keys [1] - [9]
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 italic">
          Trigger live sound effects during recording or playback!
        </span>
      </div>

      {/* Grid of Sound Buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {SOUNDS.map((sound) => {
          const isActive = activeSoundId === sound.id;
          return (
            <button
              key={sound.id}
              id={`sfx-btn-${sound.type}`}
              onClick={() => triggerSound(sound)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border bg-zinc-950/70 transition-all text-center relative overflow-hidden group ${
                sound.color
              } ${
                isActive
                  ? 'scale-95 bg-orange-500/20 border-orange-400 shadow-md shadow-orange-950 ring-2 ring-orange-400'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-xl mb-1 transition-transform group-hover:scale-125 duration-150">
                {sound.emoji}
              </span>
              <span className="text-[11px] font-bold text-zinc-200 truncate w-full">
                {sound.name}
              </span>
              <span className="text-[9px] font-mono font-black text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded mt-1 border border-zinc-800">
                Key {sound.key}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
