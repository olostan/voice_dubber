import React from 'react';
import { AlertTriangle, Trash2, CloudUpload, ArrowLeft, Disc } from 'lucide-react';

interface ConfirmDiscardModalProps {
  isOpen: boolean;
  projectTitle: string;
  takesCount: number;
  onConfirmDiscard: () => void;
  onSaveToCloudFirst?: () => void;
  onCancel: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const ConfirmDiscardModal: React.FC<ConfirmDiscardModalProps> = ({
  isOpen,
  projectTitle,
  takesCount,
  onConfirmDiscard,
  onSaveToCloudFirst,
  onCancel,
  actionTitle = 'Start New Project',
  actionDescription = 'This will replace your current workspace and discard local recordings that have not been uploaded to the cloud.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-['Plus_Jakarta_Sans']">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Alert Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Unsaved Local Project in Progress
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {actionDescription}
            </p>
          </div>
        </div>

        {/* Current Active Project Summary Card */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">Active Workspace:</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Stored in Browser
            </span>
          </div>
          <p className="text-sm font-extrabold text-white truncate">
            {projectTitle || 'Untitled Dub'}
          </p>
          <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 text-orange-400" />
              <span><strong>{takesCount}</strong> Recorded Vocal Take{takesCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Quick Save to Cloud Option (if provided) */}
          {onSaveToCloudFirst && (
            <button
              onClick={onSaveToCloudFirst}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Save & Upload to Cloud First</span>
            </button>
          )}

          {/* Destructive Confirm Discard */}
          <button
            onClick={onConfirmDiscard}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard Local Changes & {actionTitle}</span>
          </button>

          {/* Cancel / Keep Editing */}
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Keep Editing Current Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
