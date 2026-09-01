import React, { useState } from 'react';
import { Character, JudgeResult, Player } from '../types';
import confetti from 'canvas-confetti';
import { playSoundEffect } from '../utils/audioEngine';
import { X, Sparkles, Trophy, Award, Star, RefreshCw, Crown, MessageSquare } from 'lucide-react';

interface AiJudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  characters: Character[];
  scriptTitle: string;
  takesCount: number;
  onRunAiJudge: (persona: string) => Promise<JudgeResult | null>;
  judgeResult: JudgeResult | null;
  isLoading: boolean;
}

const JUDGE_PERSONAS = [
  {
    id: 'gordon',
    name: 'Gordon Ramsay of Voice Acting',
    emoji: '👨‍🍳',
    description: 'Blunt, fiery, brutally honest, but gives praise when deserved.',
  },
  {
    id: 'anime',
    name: 'Hype-Man Anime Director',
    emoji: '🔥',
    description: 'Over 9000 energy, loves screaming, epic intensity, and power moves.',
  },
  {
    id: 'critic',
    name: 'Stuffy Victorian Film Critic',
    emoji: '🧐',
    description: 'Ultra-refined cinema snob with a monocle and fancy vocabulary.',
  },
  {
    id: 'genz',
    name: 'Chaotic TikTok Gen-Z Reviewer',
    emoji: '🧢',
    description: 'Zero chill, uses slang, rates vibes and comedic rizz.',
  },
];

export const AiJudgeModal: React.FC<AiJudgeModalProps> = ({
  isOpen,
  onClose,
  players,
  characters,
  scriptTitle,
  takesCount,
  onRunAiJudge,
  judgeResult,
  isLoading,
}) => {
  const [selectedPersona, setSelectedPersona] = useState(JUDGE_PERSONAS[0].name);

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    const res = await onRunAiJudge(selectedPersona);
    if (res) {
      // Fire confetti burst!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#e11d48', '#38bdf8', '#a855f7'],
      });
      playSoundEffect('applause');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Trophy className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-['Outfit'] flex items-center gap-2">
                Gemini AI Voiceover Judge & Critic
              </h2>
              <p className="text-xs text-zinc-400">
                AI evaluation of comedic timing, passion, vocal delivery, and dub chemistry.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Persona Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Select Celebrity Judge Persona:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JUDGE_PERSONAS.map((persona) => {
                const isSelected = selectedPersona === persona.name;
                return (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona.name)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500 shadow-md'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{persona.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{persona.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                        {persona.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evaluate Action Button */}
          <button
            id="run-ai-judge-btn"
            onClick={handleEvaluate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-orange-950/60 border border-orange-400/40 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-200" />
            )}
            <span>{isLoading ? 'Judge is Reviewing Performance...' : 'Judge Our Dubbing Performance!'}</span>
          </button>

          {/* Judge Result Scorecard */}
          {judgeResult && (
            <div className="flex flex-col gap-4 bg-zinc-950/80 rounded-2xl p-5 border border-orange-500/40 shadow-inner animate-scale-in">
              {/* Winner Crown & Badge */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent border border-orange-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300 text-2xl shrink-0">
                    <Crown className="w-7 h-7 text-orange-400 animate-bounce-subtle" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                      Party Dub Champion
                    </span>
                    <h3 className="text-base font-black text-white">{judgeResult.partyWinner}</h3>
                    <p className="text-xs text-amber-200 font-semibold">{judgeResult.awardBadge}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Overall Score</span>
                  <span className="text-3xl font-black text-orange-400 font-['Outfit']">
                    {judgeResult.overallScore} / 100
                  </span>
                </div>
              </div>

              {/* Overall Verdict */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1.5 text-orange-400 font-bold text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Verdict from {judgeResult.judgeName}</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed italic">
                  "{judgeResult.overallVerdict}"
                </p>
              </div>

              {/* Player Breakdown */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase">Individual Actor Reviews:</span>
                <div className="flex flex-col gap-2">
                  {judgeResult.playerScores.map((ps, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{ps.name}</span>
                          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.2 rounded-full border border-orange-500/20">
                            Score: {ps.score}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">{ps.feedback}</p>
                        {ps.standoutMoment && (
                          <p className="text-[11px] text-orange-400/90 font-medium mt-0.5">
                            ⭐ Standout: {ps.standoutMoment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Close Showroom
          </button>
        </div>
      </div>
    </div>
  );
};
