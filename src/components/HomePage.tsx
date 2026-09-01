import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  Sparkles,
  Play,
  Volume2,
  Folder,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Film,
  Radio,
  Trophy,
  Scale,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { playSoundEffect } from '../utils/audioEngine';

interface HomePageProps {
  onLaunchStudio: () => void;
  onCaptureTab: () => void;
  onUploadVideo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenMyProjects: () => void;
  onOpenPrivacy: (tab?: 'privacy' | 'terms' | 'ai' | 'copyright') => void;
  hasActiveProject?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onLaunchStudio,
  onCaptureTab,
  onUploadVideo,
  onOpenMyProjects,
  onOpenPrivacy,
  hasActiveProject = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [playingSfx, setPlayingSfx] = useState<string | null>(null);

  const handleTestSFX = (type: string, label: string) => {
    try {
      setPlayingSfx(label);
      playSoundEffect(type, 0.9);
      setTimeout(() => setPlayingSfx(null), 800);
    } catch {
      // audio fallback
    }
  };

  // Background Interactive Web Audio Waveforms & Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic floating sound particle sparks
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      color: ['#f97316', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][
        Math.floor(Math.random() * 5)
      ],
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let phase = 0;
    let isVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) return;
      phase += 0.02;
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, width, height);

      // 1. Subtle Neon Gradient Background Glows
      const grad1 = ctx.createRadialGradient(
        width * 0.25,
        height * 0.3,
        10,
        width * 0.25,
        height * 0.3,
        width * 0.55
      );
      grad1.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.6,
        10,
        width * 0.75,
        height * 0.6,
        width * 0.5
      );
      grad2.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Fidelity Neon Sinusoidal Harmonic Soundwaves
      const waves = [
        // Primary Hero Wave Cluster (Centred around hero section ~38-45% viewport height)
        {
          baseY: height * 0.38,
          freq: 0.0022,
          amp: 48,
          harmonicFreq: 0.0007,
          harmonicAmp: 18,
          color: 'rgba(249, 115, 22, 0.45)',
          glowColor: 'rgba(249, 115, 22, 0.6)',
          lineWidth: 2.8,
          speed: 1.1,
          phaseOffset: 0,
        },
        {
          baseY: height * 0.42,
          freq: 0.0028,
          amp: 36,
          harmonicFreq: 0.0009,
          harmonicAmp: 22,
          color: 'rgba(245, 158, 11, 0.40)',
          glowColor: 'rgba(245, 158, 11, 0.5)',
          lineWidth: 2.2,
          speed: 1.5,
          phaseOffset: Math.PI * 0.4,
        },
        {
          baseY: height * 0.35,
          freq: 0.0018,
          amp: 55,
          harmonicFreq: 0.0005,
          harmonicAmp: 25,
          color: 'rgba(236, 72, 153, 0.35)',
          glowColor: 'rgba(236, 72, 153, 0.45)',
          lineWidth: 2.5,
          speed: 0.85,
          phaseOffset: Math.PI * 0.8,
        },
        // Secondary Ambient Harmonics (Flowing through mid-lower screen ~58-65% viewport height)
        {
          baseY: height * 0.62,
          freq: 0.0025,
          amp: 42,
          harmonicFreq: 0.0008,
          harmonicAmp: 20,
          color: 'rgba(6, 182, 212, 0.35)',
          glowColor: 'rgba(6, 182, 212, 0.5)',
          lineWidth: 2.0,
          speed: 1.2,
          phaseOffset: Math.PI * 1.2,
        },
        {
          baseY: height * 0.68,
          freq: 0.0032,
          amp: 32,
          harmonicFreq: 0.0011,
          harmonicAmp: 16,
          color: 'rgba(168, 85, 247, 0.30)',
          glowColor: 'rgba(168, 85, 247, 0.4)',
          lineWidth: 2.2,
          speed: 1.6,
          phaseOffset: Math.PI * 1.6,
        },
      ];

      waves.forEach((w) => {
        ctx.save();
        ctx.strokeStyle = w.color;
        ctx.shadowColor = w.glowColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = w.lineWidth;
        ctx.beginPath();

        for (let x = 0; x <= width; x += 8) {
          const mainSine = Math.sin(x * w.freq + phase * w.speed + w.phaseOffset) * w.amp;
          const harmonicSine = Math.cos(x * w.harmonicFreq + phase * (w.speed * 0.4) + w.phaseOffset) * w.harmonicAmp;
          const y = w.baseY + mainSine + harmonicSine;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // 3. Floating Sound Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(render);
    };

    if (isVisible) {
      render();
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0A0D] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      {/* Dynamic Animated Canvas Background (Fixed in Viewport) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 flex flex-col items-center gap-16 md:gap-24">
        {/* HERO SECTION */}
        <section className="w-full max-w-4xl text-center flex flex-col items-center pt-4 sm:pt-8">
          {/* Floating Hero Mic Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="relative mb-5 cursor-pointer"
            onClick={onLaunchStudio}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-orange-600/40 border border-white/20 animate-float-slow group">
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
            </div>
          </motion.div>

          {/* Animated Hero Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider shadow-inner">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Multi-Voice Video Dubbing & Comedy Studio</span>
              </div>

              {/* Special Damian Edition Animated Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-orange-500/25 border border-amber-400/50 text-amber-300 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:scale-105 transition-all cursor-default animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200">
                  Damian Edition ✨
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-['Outfit'] tracking-tight leading-[1.08] text-white">
              Fun{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 animate-gradient-slide">
                Voice Dubber
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-zinc-300 max-w-2xl mx-auto mt-4 font-normal leading-relaxed">
              Capture any video tab (up to 45s), transform your voice with real-time DSP effects, generate hilarious scripts with Gemini AI, and perform in Showtime Theater!
            </p>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto"
          >
            <button
              id="hero-launch-studio-btn"
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-orange-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>{hasActiveProject ? 'Resume Dub Studio' : 'Launch Dub Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCaptureTab}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Capture Tab (45s Max)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>Upload Video</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={onUploadVideo}
              className="hidden"
            />

            <button
              onClick={onOpenMyProjects}
              className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>My Dubs</span>
            </button>
          </motion.div>

          {/* Key Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No Sign-up or Install Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Real-time Web Audio DSP (Zero Latency)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Gemini 3.7 AI Diarization
            </span>
            <button
              onClick={() => onOpenPrivacy('privacy')}
              className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
            >
              <Shield className="w-4 h-4 text-orange-400" />
              Privacy & Creator Safe Harbor
            </button>
          </div>
        </section>

        {/* TRUST, FAIR PLAY & COPYRIGHT TRANSPARENCY BANNER */}
        <section className="w-full max-w-5xl bg-gradient-to-r from-emerald-950/30 via-zinc-900/60 to-blue-950/30 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-black font-black shadow-lg shrink-0 mt-1">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Fair, Transparent & Respectful
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  45s Parody Limit
                </span>
              </div>
              <h3 className="text-lg font-black text-white font-['Outfit'] mt-1.5">
                We Respect Creators, Copyright & Your Privacy
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                We do not sell user data, videos stay private in your browser, recordings are capped at 45 seconds for fair-use parody, and AI audio transcription is processed ephemerally without public model training.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={() => onOpenPrivacy('privacy')}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenPrivacy('copyright')}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-extrabold transition-colors shadow-md cursor-pointer"
            >
              Copyright Policy
            </button>
          </div>
        </section>

        {/* INSTANT INTERACTIVE SOUNDBOARD TEASER */}
        <section className="w-full max-w-5xl bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-['Outfit']">
                  Instant Procedural Soundboard
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Experience real-time Web Audio DSP synthesis right in your browser!
              </p>
            </div>
            <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Web Audio API Synthesizer
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-5">
            {[
              { type: 'airhorn', emoji: '📢', label: 'Airhorn' },
              { type: 'vine_boom', emoji: '💥', label: 'Vine Boom' },
              { type: 'boing', emoji: '🍄', label: 'Cartoon Boing' },
              { type: 'laser', emoji: '🔫', label: 'Sci-Fi Laser' },
              { type: 'rimshot', emoji: '🥁', label: 'Ba-Dum Tss' },
              { type: 'gasp', emoji: '😱', label: 'Dramatic Gasp' },
            ].map((sfx) => (
              <button
                key={sfx.type}
                onClick={() => handleTestSFX(sfx.type, sfx.label)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 group active:scale-95 cursor-pointer ${
                  playingSfx === sfx.label
                    ? 'bg-amber-500/30 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-zinc-950/70 hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                  {sfx.emoji}
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 mt-2 text-center">
                  {sfx.label}
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5">Click to Play</span>
              </button>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS / KEY FEATURES */}
        <section className="w-full max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              Endless Voice Dubbing Fun in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              From solo voice acting practice to multi-player living room party competitions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                1. Capture Any Video Tab
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dub directly over short video scenes, animated memes, cartoon shows, or uploaded video clips (up to 45 seconds). Tab audio is recorded in sync with your mic.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                2. Real-Time Voice Modifiers
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Transform vocal takes into Robot ring modulation, Chipmunk squeaks, Deep Villain overdrive, Megaphone bandpass, and Arena Reverb.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                3. Showtime Theater & AI Judge
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Watch in fullscreen cinematic Showtime Theater, trigger live crowd soundboard reactions, and let the Gemini AI Judge rate your comic timing!
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA CALLOUT */}
        <section className="w-full max-w-4xl bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-rose-600/20 border-2 border-orange-500/40 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-black font-black shadow-lg">
            <Mic className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
            Ready to Record Your First Dub?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
            No signup or install required. Jump straight into the studio, record your takes, and experience Showtime Theater!
          </p>
          <button
            onClick={onLaunchStudio}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-base tracking-wide flex items-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Launch Fun Voice Dubber Studio</span>
          </button>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-zinc-800/80 bg-zinc-950/90 py-8 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 font-['Outfit'] font-bold text-zinc-300">
              <Mic className="w-4 h-4 text-orange-400" />
              <span>Fun Voice Dubber © 2026</span>
            </div>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <p className="text-zinc-400 text-xs">
              Crafted with ❤️ for <span className="text-amber-300 font-bold">Damian</span> & creative dubbers everywhere
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400 font-medium">
            <button
              onClick={() => onOpenPrivacy('privacy')}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenPrivacy('terms')}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenPrivacy('ai')}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              AI Safety
            </button>
            <button
              onClick={() => onOpenPrivacy('copyright')}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Copyright & DMCA
            </button>
            <button
              onClick={onOpenMyProjects}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              My Dubs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
