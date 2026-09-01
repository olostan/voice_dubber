import React, { useState, useEffect, useRef } from 'react';
import { AudioTake, Character, VoiceEffect } from '../types';
import { getAudioContext, applyVoiceEffectChain, playTakePreviewWithEffect, stopTakePreview } from '../utils/audioEngine';
import { Wand2, Volume2, Mic, Check, Play, Square, Sparkles } from 'lucide-react';

interface VoiceEffectsSelectorProps {
  selectedEffect: VoiceEffect;
  onSelectEffect: (effect: VoiceEffect) => void;
  targetTake?: AudioTake | null;
  targetCharacter?: Character | null;
  onApplyEffectToTake?: (takeId: string, effect: VoiceEffect) => void;
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
  targetTake,
  targetCharacter,
  onApplyEffectToTake,
}) => {
  const [isTestingLive, setIsTestingLive] = useState(false);
  const [isAuditioningTake, setIsAuditioningTake] = useState(false);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const testEffectOutRef = useRef<GainNode | null>(null);

  // Play Take with Specific FX
  const handleAuditionTakeWithEffect = (effect: VoiceEffect) => {
    onSelectEffect(effect);
    if (targetTake && onApplyEffectToTake) {
      onApplyEffectToTake(targetTake.id, effect);
    }

    if (targetTake?.audioBuffer) {
      setIsAuditioningTake(true);
      playTakePreviewWithEffect(targetTake.audioBuffer, effect, 1.0, () => {
        setIsAuditioningTake(false);
      });
    }
  };

  const toggleAuditionTake = () => {
    if (isAuditioningTake) {
      stopTakePreview();
      setIsAuditioningTake(false);
      return;
    }

    if (targetTake?.audioBuffer) {
      setIsAuditioningTake(true);
      playTakePreviewWithEffect(targetTake.audioBuffer, selectedEffect, 1.0, () => {
        setIsAuditioningTake(false);
      });
    }
  };

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
      stopTakePreview();
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div id="voice-effects-selector" className="w-full bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 shadow-xl flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Wand2 className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-['Outfit']">
            Real-Time Voice Modifiers
          </h3>
          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            Zero Latency FX
          </span>

          {targetTake && (
            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Auditioning: <strong className="text-white">{targetCharacter?.name || 'Dub Take'}</strong> ({targetTake.duration.toFixed(1)}s)
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Audition Dub Take Button */}
          {targetTake && (
            <button
              id="audition-dub-fx-btn"
              onClick={toggleAuditionTake}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-md ${
                isAuditioningTake
                  ? 'bg-amber-500 text-black border-amber-400 shadow-amber-950/80 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:text-white border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/30'
              }`}
              title="Hear how this selected voice effect sounds on your recorded vocal take!"
            >
              {isAuditioningTake ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Audition</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Audition FX on Take</span>
                </>
              )}
            </button>
          )}

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
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {EFFECTS.map((effect) => {
          const isSelected = selectedEffect === effect.id;
          const isPlayingThisEffect = isAuditioningTake && isSelected;

          return (
            <button
              key={effect.id}
              id={`voice-effect-${effect.id}`}
              onClick={() => handleAuditionTakeWithEffect(effect.id)}
              className={`flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group min-h-[140px] ${
                isPlayingThisEffect
                  ? 'border-amber-400 bg-amber-950/60 shadow-xl shadow-amber-950/80 ring-2 ring-amber-400 scale-[1.03] animate-pulse'
                  : isSelected
                  ? 'border-orange-500 bg-orange-950/40 shadow-xl shadow-orange-950/40 ring-2 ring-orange-500 scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-2xl transition-transform group-hover:scale-110">{effect.emoji}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <span className="text-xs font-black text-white group-hover:text-orange-300 transition-colors block leading-snug">
                  {effect.name}
                </span>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                  {effect.description}
                </p>
              </div>

              <div className="w-full flex items-center justify-between mt-2.5">
                <span className="text-[9px] font-mono font-bold uppercase bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                  {effect.tag}
                </span>
                {targetTake && isSelected && (
                  <span className="text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                    <Volume2 className="w-3 h-3" />
                    Audition
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
