import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Plus, Mic, Folder, CloudUpload, LogOut, User, Edit3, Check } from 'lucide-react';
import { AuthUserProfile } from '../utils/auth';

interface HeaderProps {
  projectTitle?: string;
  onRenameProject?: (newTitle: string) => void;
  onOpenAiJudge: () => void;
  onOpenExport: () => void;
  hasTakes: boolean;
  hasVideoLoaded?: boolean;
  onResetClip?: () => void;
  user: AuthUserProfile | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  onOpenMyProjects: () => void;
  onSaveToCloud?: () => void;
  isSavingToCloud?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle = 'Scene Dialogue',
  onRenameProject,
  onOpenAiJudge,
  onOpenExport,
  hasTakes,
  hasVideoLoaded = false,
  onResetClip,
  user,
  onSignInWithGoogle,
  onSignOut,
  onOpenMyProjects,
  onSaveToCloud,
  isSavingToCloud = false,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectTitle);

  useEffect(() => {
    setTitleInput(projectTitle);
  }, [projectTitle]);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && onRenameProject && trimmed !== projectTitle) {
      onRenameProject(trimmed);
    }
    setIsEditingTitle(false);
  };

  return (
    <header id="app-header" className="border-b border-zinc-800/80 bg-[#121215]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Editable Project Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 text-white font-black text-lg shrink-0">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-zinc-100 font-['Outfit'] tracking-tight">
                  Voice <span className="text-orange-400">Dubber</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                  Studio
                </span>
              </div>
            </div>
          </div>

          {/* Inline Project Title Rename Pill */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1 rounded-xl transition-all shadow-inner group">
            <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  id="project-rename-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleInput(projectTitle);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="bg-zinc-950 text-white font-extrabold text-xs px-2 py-0.5 rounded border border-orange-500 focus:outline-none max-w-[200px]"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded bg-orange-500 hover:bg-orange-600 text-black font-bold"
                  title="Save title"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="rename-project-btn"
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white transition-colors text-left"
                title="Click to rename project"
              >
                <span className="max-w-[150px] sm:max-w-[220px] truncate">{projectTitle || 'Untitled Dub'}</span>
                <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Google Auth Profile */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          {/* My Dubs Cloud Drawer */}
          <button
            id="my-dubs-btn"
            onClick={onOpenMyProjects}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all shadow-sm"
            title="View your saved cloud dubs"
          >
            <Folder className="w-3.5 h-3.5 text-orange-400" />
            <span>My Dubs</span>
          </button>

          {/* Cloud Save / Share Button */}
          {hasVideoLoaded && onSaveToCloud && (
            <button
              onClick={onSaveToCloud}
              disabled={isSavingToCloud}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all shadow-sm"
              title="Save project to cloud & generate shareable link"
            >
              <CloudUpload className={`w-3.5 h-3.5 text-amber-400 ${isSavingToCloud ? 'animate-bounce' : ''}`} />
              <span>{isSavingToCloud ? 'Saving...' : 'Save & Share'}</span>
            </button>
          )}

          {/* New Dub Button */}
          {hasVideoLoaded && onResetClip && (
            <button
              id="new-dub-btn"
              onClick={onResetClip}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all"
              title="Start a new dub with a new tab capture or video clip"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>New Dub</span>
            </button>
          )}

          {/* AI Judge Button */}
          {hasTakes && (
            <button
              id="ai-judge-trigger-btn"
              onClick={onOpenAiJudge}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-950/50 border border-orange-400/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>AI Judge</span>
            </button>
          )}

          {/* Export Video Button */}
          <button
            id="export-video-btn"
            onClick={onOpenExport}
            disabled={!hasTakes}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hasTakes
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950/50 border border-orange-400/30'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Export Dub</span>
          </button>

          {/* Google Sign In / User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-orange-500/50 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-zinc-200 max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={onOpenMyProjects}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors text-left"
                  >
                    <Folder className="w-3.5 h-3.5 text-orange-400" />
                    <span>My Dubbing Projects</span>
                  </button>

                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-colors text-left mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInWithGoogle}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 shadow-sm transition-all"
              title="Sign in with Google to sync your dubs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
