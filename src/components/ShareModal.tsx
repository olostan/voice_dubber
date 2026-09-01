import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Globe, Sparkles, X, MessageSquare, Twitter, CloudUpload, Play } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectTitle: string;
  takesCount: number;
  onSaveToCloud?: () => void;
  isSavingToCloud?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  takesCount,
  onSaveToCloud,
  isSavingToCloud,
}) => {
  const [isCopiedView, setIsCopiedView] = useState(false);
  const [isCopiedStudio, setIsCopiedStudio] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareId = projectId;
  const showtimeUrl = shareId ? `${origin}/view#${shareId}` : '';
  const studioUrl = shareId ? `${origin}/studio#${shareId}` : '';

  const handleCopy = async (url: string, type: 'view' | 'studio') => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      if (type === 'view') {
        setIsCopiedView(true);
        setTimeout(() => setIsCopiedView(false), 3000);
      } else {
        setIsCopiedStudio(true);
        setTimeout(() => setIsCopiedStudio(false), 3000);
      }
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (!showtimeUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Fun Voice Dubber: ${projectTitle}`,
          text: `Check out our voice dub for "${projectTitle}" on Fun Voice Dubber! 🎙️`,
          url: showtimeUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopy(showtimeUrl, 'view');
    }
  };

  const tweetUrl = showtimeUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out our voice dub of "${projectTitle}" on Fun Voice Dubber! 🎙️😂 ${showtimeUrl}`
      )}`
    : '#';

  const whatsappUrl = showtimeUrl
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Check out our hilarious dub for "${projectTitle}" on Fun Voice Dubber! 🎙️ ${showtimeUrl}`
      )}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans']">
      <div
        className="relative w-full max-w-lg bg-[#141418] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-black font-black shadow-lg shadow-orange-950/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white">Share Your Dub</h2>
              <p className="text-xs text-zinc-400">Stream your video and voice dubs anywhere</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Project Preview Badge */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                {shareId ? 'Ready to Share' : 'Unsaved Local Takes'}
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1 truncate">{projectTitle}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {takesCount > 0 ? `${takesCount} vocal takes recorded` : 'Dialogue script & soundstage ready'}
              </p>
            </div>
            <div className="text-2xl shrink-0">🎬</div>
          </div>

          {!shareId ? (
            /* Upload to Cloud Prompt */
            <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-500/10 to-amber-500/5 border border-orange-500/20 text-center space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                To generate share links for Showtime Theater & the Studio Editor, upload this project to Cloud Storage.
              </p>
              <button
                onClick={onSaveToCloud}
                disabled={isSavingToCloud}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-orange-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSavingToCloud ? 'Uploading to Cloud...' : 'Upload & Generate Share Links'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Showtime Theater Link (Audience View) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                    <span>🍿 Showtime Theater Link (Watch Only)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Cinema & Reactions</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="share-view-link-input"
                    type="text"
                    readOnly
                    value={showtimeUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleCopy(showtimeUrl, 'view')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shrink-0 ${
                      isCopiedView
                        ? 'bg-emerald-500 text-black'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
                    }`}
                  >
                    {isCopiedView ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedView ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Studio Editor Link (Collaborative Studio) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                    <Globe className="w-3.5 h-3.5 text-orange-400" />
                    <span>🎙️ Studio Editor Link (Edit & Record)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Collaborate & Remix</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="share-studio-link-input"
                    type="text"
                    readOnly
                    value={studioUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => handleCopy(studioUrl, 'studio')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shrink-0 ${
                      isCopiedStudio
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {isCopiedStudio ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedStudio ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Web Share</span>
                </button>

                <a
                  href={tweetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span>Post on X</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-bold transition-colors col-span-2 sm:col-span-1 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
