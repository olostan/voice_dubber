import React, { useState, useEffect } from 'react';
import { CloudProjectPayload, fetchUserProjects, deleteProjectFromCloud, updateProjectInCloud } from '../utils/cloudSync';
import { AuthUserProfile } from '../utils/auth';
import { Folder, Plus, Trash2, Edit3, Check, X, Share2, Play, Sparkles, Clock, Film, Copy, CheckCircle2 } from 'lucide-react';

interface MyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUserProfile | null;
  onSelectProject: (project: CloudProjectPayload) => void;
  onCreateNewProject: () => void;
  onSignInWithGoogle: () => void;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectProject,
  onCreateNewProject,
  onSignInWithGoogle,
}) => {
  const [projects, setProjects] = useState<CloudProjectPayload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');

  const loadProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const items = await fetchUserProjects(user.uid);
      setProjects(items);
    } catch (err) {
      console.warn('Failed to load user projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadProjects();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopyShareLink = (shareId: string) => {
    const url = `${window.location.origin}/view#${shareId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to delete this dub project from the cloud?')) return;
    try {
      await deleteProjectFromCloud(shareId);
      setProjects((prev) => prev.filter((p) => (p.shareId || p.id) !== shareId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleStartEdit = (proj: CloudProjectPayload) => {
    const id = proj.shareId || proj.id || '';
    setEditingId(id);
    setEditTitle(proj.title);
    setEditGenre(proj.genre || 'Dubbing');
  };

  const handleSaveEdit = async (shareId: string) => {
    try {
      await updateProjectInCloud(shareId, {
        title: editTitle.trim() || 'Untitled Dub',
        genre: editGenre.trim() || 'Dubbing',
      });
      setProjects((prev) =>
        prev.map((p) =>
          (p.shareId || p.id) === shareId
            ? { ...p, title: editTitle.trim() || 'Untitled Dub', genre: editGenre.trim() }
            : p
        )
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update project');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/60 text-white">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                My Dubbing Projects
                {user && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {projects.length} Saved
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                {user
                  ? `Logged in as ${user.displayName || user.email}`
                  : 'Sign in to access your cloud-synced dubs across devices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => {
                  onCreateNewProject();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950/60 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Dub</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!user ? (
            /* Logged Out Prompt */
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl mb-4 shadow-xl">
                🔐
              </div>
              <h3 className="text-lg font-black text-white mb-2">Sign in to Save & Manage Dubs</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Connect with your Google account to automatically store script lines, actor lineups, and custom scenes safely in the cloud with zero hassle.
              </p>
              <button
                onClick={onSignInWithGoogle}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-sm shadow-xl transition-all transform hover:scale-105"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-zinc-400">Loading your cloud dubs...</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="py-14 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-3xl mb-4">
                🎬
              </div>
              <h3 className="text-base font-black text-white mb-1">No Cloud Dubs Yet</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Record your first tab video, select an animated preset, or import a clip to start dubbing.
              </p>
              <button
                onClick={() => {
                  onCreateNewProject();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-950/80 transition-all"
              >
                Create First Dub
              </button>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const shareId = proj.shareId || proj.id || '';
                const isEditing = editingId === shareId;

                return (
                  <div
                    key={shareId}
                    className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                          {proj.genre || 'Dubbing'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyShareLink(shareId)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Copy shareable project link"
                          >
                            {copiedId === shareId ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleStartEdit(proj)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Edit project name & genre"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(shareId)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Delete dub project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Synopsis */}
                      {isEditing ? (
                        <div className="flex flex-col gap-2 my-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                            placeholder="Project Title"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editGenre}
                              onChange={(e) => setEditGenre(e.target.value)}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500 flex-1"
                              placeholder="Genre"
                            />
                            <button
                              onClick={() => handleSaveEdit(shareId)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-black text-white line-clamp-1 group-hover:text-orange-300 transition-colors">
                            {proj.title}
                          </h4>
                          {proj.synopsis && (
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                              {proj.synopsis}
                            </p>
                          )}
                        </>
                      )}

                      {/* Character Avatars & Metrics */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/80">
                        <div className="flex items-center -space-x-1.5">
                          {(proj.characters || []).slice(0, 4).map((c, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border-2 border-zinc-900 flex items-center justify-center text-[10px]"
                              style={{ backgroundColor: c.color || '#f59e0b' }}
                              title={c.name}
                            >
                              {c.avatarIcon || '🎭'}
                            </div>
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {proj.lines?.length || 0} lines • {proj.duration || 15}s
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <button
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 hover:bg-orange-500 text-zinc-300 hover:text-white font-bold text-xs transition-all border border-zinc-800 hover:border-orange-400 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open in Studio</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
