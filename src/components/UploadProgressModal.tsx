import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudUpload, RefreshCw, AlertCircle, CheckCircle2, X, Sparkles, Wifi } from 'lucide-react';

export interface UploadState {
  isOpen: boolean;
  phase: 'preparing' | 'uploading' | 'finalizing' | 'done' | 'retrying' | 'error';
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

interface UploadProgressModalProps {
  uploadState: UploadState;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ uploadState }) => {
  const {
    isOpen,
    phase,
    percent,
    loadedBytes,
    totalBytes,
    message,
    attempt = 1,
    maxAttempts = 3,
    error,
    onRetry,
    onCancel,
  } = uploadState;

  if (!isOpen) return null;

  const isError = phase === 'error';
  const isRetrying = phase === 'retrying';
  const isDone = phase === 'done';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#121216] border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/40 text-white overflow-hidden font-['Plus_Jakarta_Sans']"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                isError
                  ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                  : isDone
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : isRetrying
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-bounce'
                  : 'bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-8 h-8" />
              ) : isDone ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : isRetrying ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <CloudUpload className="w-8 h-8 animate-pulse" />
              )}
            </div>

            <h3 className="text-xl font-black font-['Outfit'] tracking-tight">
              {isError
                ? 'Upload Interrupted'
                : isDone
                ? 'Upload Complete!'
                : isRetrying
                ? `Retrying Upload (Attempt ${attempt}/${maxAttempts})`
                : 'Saving & Uploading Dub to Cloud'}
            </h3>

            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              {error || message || 'Transferring media assets to high-speed cloud storage...'}
            </p>
          </div>

          {/* Progress Bar & Stats */}
          {!isError && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-zinc-400">
                  {totalBytes > 0
                    ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
                    : isDone
                    ? '100%'
                    : 'Compressing & packaging...'}
                </span>
                <span className="text-orange-400 font-extrabold">{Math.round(percent)}%</span>
              </div>

              {/* Linear Progress Track */}
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full shadow-lg shadow-orange-500/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(percent, isDone ? 100 : 3))}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Hardware compression active</span>
                </span>
                <span>{phase === 'finalizing' ? 'Syncing share ID...' : 'Direct GCS stream'}</span>
              </div>
            </div>
          )}

          {/* Step Badges */}
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
            <div
              className={`p-2 rounded-xl border transition-all ${
                percent >= 10
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
              }`}
            >
              1. Video File
            </div>
            <div
              className={`p-2 rounded-xl border transition-all ${
                percent >= 60
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
              }`}
            >
              2. Vocal Takes
            </div>
            <div
              className={`p-2 rounded-xl border transition-all ${
                percent >= 98 || isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
              }`}
            >
              3. Share Link
            </div>
          </div>

          {/* Action Buttons (Error / Retry / Cancel) */}
          {isError && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Upload Now</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
