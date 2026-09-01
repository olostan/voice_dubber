import React, { useState, useEffect, useRef } from 'react';
import { VoiceEffect } from '../types';
import { getAudioContext, applyVoiceEffectChain } from '../utils/audioEngine';
import { Wand2, Volume2, Mic, Check } from 'lucide-react';

interface VoiceEffectsSelectorProps {
  selectedEffect: VoiceEffect;
  onSelectEffect: (effect: VoiceEffect) => void;
}

interface EffectOption {
  id: VoiceEffect;
  name: string;
  emoji: string;
  description: string;
  tag: string;
  color: string;
}

const EFFECTS: EffectOption[] = [
  {
    id: 'none',
    name: 'Natural Studio',
    emoji: '🎙️',
    description: 'Clean, uncompressed natural microphone audio.',
    tag: 'Clean',
    color: 'from-slate-600 to-slate-700',
  },
  {
    id: 'villain',
    name: 'Deep Movie Villain',
    emoji: '🦹‍♂️',
    description: 'Heavy sub-bass boost with warm cinematic saturation.',
    tag: 'Deep Bass',
    color: 'from-rose-700 to-purple-900',
  },
  {
    id: 'chipmunk',
    name: 'Helium / Chipmunk',
    emoji: '🐿️',
    description: 'Resonant high-frequency boost for squeaky comedy.',
    tag: 'High Formant',
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'robot',
    name: 'Cybernetic Robot',
    emoji: '🤖',
    description: 'Ring-modulated robotic voice synthesis.',
    tag: 'Ring Mod',
    color: 'from-sky-600 to-indigo-800',
  },
  {
    id: 'radio',
    name: 'Walkie-Talkie Intercom',
    emoji: '📻',
    description: 'Lo-Fi narrow bandpass filter with overdrive grit.',
    tag: '300Hz-3kHz',
    color: 'from-emerald-700 to-teal-900',
  },
  {
    id: 'reverb',
    name: 'Cathedral Reverb',
    emoji: '🏛️',
    description: 'Lush atmospheric echo with ethereal stereo tail.',
    tag: 'Ethereal Space',
    color: 'from-purple-600 to-pink-700',
  },
  {
    id: 'megaphone',
    name: 'Hype Megaphone',
    emoji: '📢',
    description: 'Aggressive midrange boost with hard speaker clipping.',
    tag: 'Hard Clipper',
    color: 'from-orange-600 to-red-700',
  },
];

export const VoiceEffectsSelector: React.FC<VoiceEffectsSelectorProps> = ({
  selectedEffect,
  onSelectEffect,
}) => {
  const [isTestingLive, setIsTestingLive] = useState(false);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const testEffectOutRef = useRef<GainNode | null>(null);

  // Live mic monitoring toggle
  const toggleLiveTest = async () => {
    if (isTestingLive) {
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
        testStreamRef.current = null;
      }
      setIsTestingLive(false);
      return;
    }

    try {
      const ctx = getAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      testStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      testSourceRef.current = source;

      const effectOut = ctx.createGain();
      testEffectOutRef.current = effectOut;
      effectOut.gain.setValueAtTime(0.7, ctx.currentTime);

      applyVoiceEffectChain(ctx, source, selectedEffect, effectOut);
      effectOut.connect(ctx.destination);

      setIsTestingLive(true);
    } catch (e) {
      console.warn('Live test mic error:', e);
      setIsTestingLive(false);
    }
  };

  // Re-apply effect chain if changed while live testing
  useEffect(() => {
    if (!isTestingLive || !testSourceRef.current || !testEffectOutRef.current) return;
    const ctx = getAudioContext();
    testSourceRef.current.disconnect();
    applyVoiceEffectChain(ctx, testSourceRef.current, selectedEffect, testEffectOutRef.current);
  }, [selectedEffect, isTestingLive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div id="voice-effects-selector" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
            Real-Time Voice Modifiers
          </h3>
          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            Zero Latency FX
          </span>
        </div>

        {/* Live Mic Test Button */}
        <button
          id="test-voice-fx-btn"
          onClick={toggleLiveTest}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isTestingLive
              ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-950/50 animate-pulse'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
          }`}
          title="Wear headphones to prevent audio feedback loop"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{isTestingLive ? 'Mute Mic Preview' : 'Test FX in Headphones'}</span>
        </button>
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {EFFECTS.map((effect) => {
          const isSelected = selectedEffect === effect.id;
          return (
            <button
              key={effect.id}
              id={`voice-effect-${effect.id}`}
              onClick={() => onSelectEffect(effect.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-orange-500 bg-orange-950/30 shadow-lg shadow-orange-950/30 ring-1 ring-orange-500'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-2xl">{effect.emoji}</span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                {effect.name}
              </span>
              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                {effect.description}
              </p>

              <span className="mt-2 text-[9px] font-mono uppercase bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
                {effect.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
