import { AudioTake, VoiceEffect } from '../types';
import { getAudioContext, applyVoiceEffectChain } from './audioEngine';

export interface TabCaptureSession {
  stream: MediaStream;
  hasAudio: boolean;
  stop: () => Promise<{ videoBlob: Blob; videoUrl: string; duration: number; hasAudio: boolean }>;
}

// Start Screen / Tab capture and return a session handle that can be stopped at any time
export async function startTabOrScreenCapture(): Promise<TabCaptureSession> {
  if (!navigator?.mediaDevices?.getDisplayMedia) {
    throw new Error(
      'Screen/Tab capture is unavailable in this environment. Please ensure you are accessing the app via http://localhost:3000 (or HTTPS), or open the app in a standalone desktop browser tab.'
    );
  }

  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'browser',
    } as any,
    audio: true, // allows capturing tab audio if user checks "Share tab audio"
  });

  const hasAudio = displayStream.getAudioTracks().length > 0;
  const chunks: Blob[] = [];
  const startTime = Date.now();

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const recorder = new MediaRecorder(displayStream, {
    mimeType,
    videoBitsPerSecond: 1200000, // 1.2 Mbps efficient VP9/VP8 web compression (~4.5MB per 30s)
    audioBitsPerSecond: 64000, // 64 kbps Opus audio compression
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start(200);

  let isStopped = false;

  const stopPromise = new Promise<{ videoBlob: Blob; videoUrl: string; duration: number; hasAudio: boolean }>(
    (resolve, reject) => {
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        const duration = Math.max(1, (Date.now() - startTime) / 1000);
        resolve({ videoBlob, videoUrl, duration, hasAudio });
      };

      recorder.onerror = (err) => {
        reject(err);
      };
    }
  );

  const stop = async () => {
    if (isStopped) return stopPromise;
    isStopped = true;

    // Request final data slice
    if (recorder.state === 'recording') {
      recorder.stop();
    }

    // Stop all media tracks (dismisses the browser sharing indicator)
    displayStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        // ignore
      }
    });

    return stopPromise;
  };

  // If user clicks browser's native "Stop sharing" button on the floating bar
  displayStream.getVideoTracks().forEach((track) => {
    track.onended = () => {
      if (!isStopped) {
        stop();
      }
    };
  });

  return {
    stream: displayStream,
    hasAudio,
    stop,
  };
}

// Microphone Recorder Instance with Live VU Monitoring
export class MicTakeRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;

  async start(onVuUpdate?: (level: number) => void): Promise<void> {
    this.audioChunks = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const ctx = getAudioContext();
    const source = ctx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    source.connect(this.analyserNode);

    // VU meter loop
    if (onVuUpdate) {
      const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      const updateMeter = () => {
        if (!this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        onVuUpdate(avg);
        this.animFrameId = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.startTime = Date.now();
    this.mediaRecorder.start(100);
  }

  stop(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve) => {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve({ blob, url: URL.createObjectURL(blob), duration: 0 });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - this.startTime) / 1000;

        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((t) => t.stop());
          this.mediaStream = null;
        }

        resolve({ blob, url, duration });
      };

      this.mediaRecorder.stop();
    });
  }
}

// Client-side Video Compositor & Exporter
export async function exportDubbedVideo(
  videoElement: HTMLVideoElement | null,
  canvasDrawer: ((ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => void) | null,
  duration: number,
  takes: AudioTake[],
  videoVolume = 1.0,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; url: string }> {
  const width = 1280;
  const height = 720;
  const fps = 30;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d')!;

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const destNode = audioCtx.createMediaStreamDestination();

  // Schedule all audio takes onto the destination node
  for (const take of takes) {
    if (take.muted) continue;
    try {
      const buffer = take.audioBuffer || (await audioCtx.decodeAudioData(await take.audioBlob.arrayBuffer()));
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(take.volume, 0);

      const effectOut = audioCtx.createGain();
      applyVoiceEffectChain(audioCtx, gainNode, take.effect, effectOut);
      effectOut.connect(destNode);

      sourceNode.connect(gainNode);
      // Start at take's offset
      const startAt = Math.max(0, take.startTimeOffset);
      sourceNode.start(startAt);
    } catch (e) {
      console.warn('Audio export take error:', e);
    }
  }

  // If source video has audio and videoElement is provided
  if (videoElement && videoVolume > 0) {
    try {
      const vidSource = audioCtx.createMediaElementSource(videoElement);
      const vidGain = audioCtx.createGain();
      vidGain.gain.setValueAtTime(videoVolume, 0);
      vidSource.connect(vidGain);
      vidGain.connect(destNode);
    } catch (e) {
      // Element might already be connected or canvas based
    }
  }

  const canvasStream = exportCanvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destNode.stream.getAudioTracks(),
  ]);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm',
    videoBitsPerSecond: 3500000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      audioCtx.close();
      const finalBlob = new Blob(chunks, { type: 'video/webm' });
      resolve({ blob: finalBlob, url: URL.createObjectURL(finalBlob) });
    };

    recorder.start(100);

    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play().catch(() => {});
    }

    const totalFrames = Math.floor(duration * fps);
    let currentFrame = 0;
    const intervalMs = 1000 / fps;

    const renderLoop = setInterval(() => {
      const currentTime = currentFrame / fps;

      if (videoElement && !videoElement.paused) {
        ctx.drawImage(videoElement, 0, 0, width, height);
      } else if (canvasDrawer) {
        canvasDrawer(ctx, currentTime, width, height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // Add watermark overlay
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(20, height - 50, 260, 32);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillText('🎙️ The Choice Voicer Dub', 32, height - 28);

      currentFrame++;
      if (onProgress) {
        onProgress(Math.min(100, Math.round((currentFrame / totalFrames) * 100)));
      }

      if (currentFrame >= totalFrames) {
        clearInterval(renderLoop);
        if (videoElement) videoElement.pause();
        recorder.stop();
      }
    }, intervalMs);
  });
}
