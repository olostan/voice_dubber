import { VoiceEffect } from '../types';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert audio blob to AudioBuffer
export async function blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;

  const length = buffer.length * numOfChan * bytesPerSample + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + buffer.length * numOfChan * bytesPerSample, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numOfChan, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, buffer.length * numOfChan * bytesPerSample, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = channels[channel][i];
      // Clamp to -1..1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed int
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert Blob to base64 string
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Extract audio track from any video Blob or URL, decode AudioBuffer, run VAD & generate base64
export async function extractAudioFromVideo(
  videoBlobOrUrl: Blob | string
): Promise<{
  audioBlob: Blob;
  audioBuffer: AudioBuffer;
  base64Audio: string;
  vadSegments: { start: number; end: number }[];
  duration: number;
}> {
  const ctx = getAudioContext();
  let arrayBuffer: ArrayBuffer;

  if (typeof videoBlobOrUrl === 'string') {
    const resp = await fetch(videoBlobOrUrl);
    arrayBuffer = await resp.arrayBuffer();
  } else {
    arrayBuffer = await videoBlobOrUrl.arrayBuffer();
  }

  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  const duration = audioBuffer.duration;
  const vadSegments = detectVoiceSegments(audioBuffer);
  const audioBlob = audioBufferToWav(audioBuffer);
  const base64Audio = await blobToBase64(audioBlob);

  return {
    audioBlob,
    audioBuffer,
    base64Audio,
    vadSegments,
    duration,
  };
}

// Web Audio Vocal Reducer / Voice Isolator Filter
// Dampens standard dialogue vocal frequencies (300Hz - 3.4kHz) or center-channel speech
export function applyVocalReducerFilter(
  ctx: AudioContext,
  sourceNode: AudioNode,
  outputNode: AudioNode,
  vocalReductionAmount = 0.85
) {
  if (vocalReductionAmount <= 0) {
    sourceNode.connect(outputNode);
    return;
  }

  // Create dual notch and shelf filters in the human vocal range (300Hz - 3.4kHz)
  const notch1 = ctx.createBiquadFilter();
  notch1.type = 'peaking';
  notch1.frequency.setValueAtTime(1000, ctx.currentTime);
  notch1.Q.setValueAtTime(0.7, ctx.currentTime);
  notch1.gain.setValueAtTime(-18 * vocalReductionAmount, ctx.currentTime);

  const notch2 = ctx.createBiquadFilter();
  notch2.type = 'peaking';
  notch2.frequency.setValueAtTime(2500, ctx.currentTime);
  notch2.Q.setValueAtTime(0.8, ctx.currentTime);
  notch2.gain.setValueAtTime(-14 * vocalReductionAmount, ctx.currentTime);

  sourceNode.connect(notch1);
  notch1.connect(notch2);
  notch2.connect(outputNode);
}

// Extract waveform peaks from AudioBuffer for UI rendering
export function extractWaveformData(buffer: AudioBuffer, samples = 100): number[] {
  const rawData = buffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / samples);
  const filteredData: number[] = [];

  for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[blockStart + j] || 0);
    }
    const avg = sum / blockSize;
    filteredData.push(Math.min(1, avg * 2.5));
  }
  return filteredData;
}

// Voice Activity Detection (VAD) on AudioBuffer to detect speech segments
export function detectVoiceSegments(
  buffer: AudioBuffer,
  threshold = 0.04,
  minSegmentDuration = 0.2,
  minSilenceDuration = 0.3
): { start: number; end: number }[] {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const numWindows = Math.floor(data.length / windowSize);

  const energies: number[] = [];
  for (let w = 0; w < numWindows; w++) {
    let sumSquares = 0;
    const start = w * windowSize;
    for (let i = 0; i < windowSize; i++) {
      const val = data[start + i] || 0;
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    energies.push(rms);
  }

  const segments: { start: number; end: number }[] = [];
  let inSpeech = false;
  let currentStart = 0;
  let silenceCount = 0;
  const silenceWindowsThreshold = Math.floor(minSilenceDuration / 0.05);

  for (let i = 0; i < energies.length; i++) {
    const energy = energies[i];
    const time = i * 0.05;

    if (energy > threshold) {
      if (!inSpeech) {
        inSpeech = true;
        currentStart = Math.max(0, time - 0.1); // add slight padding
      }
      silenceCount = 0;
    } else {
      if (inSpeech) {
        silenceCount++;
        if (silenceCount >= silenceWindowsThreshold) {
          const currentEnd = time;
          if (currentEnd - currentStart >= minSegmentDuration) {
            segments.push({ start: currentStart, end: currentEnd });
          }
          inSpeech = false;
          silenceCount = 0;
        }
      }
    }
  }

  if (inSpeech) {
    const end = energies.length * 0.05;
    if (end - currentStart >= minSegmentDuration) {
      segments.push({ start: currentStart, end });
    }
  }

  return segments;
}

// Generate synthesized sound effects (100% Web Audio API, Zero Lag)
export function playSoundEffect(type: string, masterVolume = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(masterVolume, now);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'vine_boom': {
        // Heavy bass sub-drop + punch
        const osc = ctx.createOscillator();
        const punchOsc = ctx.createOscillator();
        const punchGain = ctx.createGain();
        const subGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        punchOsc.type = 'triangle';
        punchOsc.frequency.setValueAtTime(220, now);
        punchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        punchGain.gain.setValueAtTime(0.8, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(subGain);
        subGain.connect(gainNode);
        punchOsc.connect(punchGain);
        punchGain.connect(gainNode);

        osc.start(now);
        punchOsc.start(now);
        osc.stop(now + 1.3);
        punchOsc.stop(now + 0.3);
        break;
      }

      case 'airhorn': {
        // Classic party airhorn (stacked detuned saws)
        const freqs = [466.16, 466.16 * 1.01, 370.0, 311.13];
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.setValueAtTime(f * 1.05, now + 0.08);
          osc.frequency.setValueAtTime(f, now + 0.15);

          g.gain.setValueAtTime(0.25, now);
          g.gain.setValueAtTime(0.25, now + 0.35);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc.connect(g);
          g.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.55);
        });
        break;
      }

      case 'rimshot': {
        // High snappy snare + rim hit + kick
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(gainNode);

        // Rim tone
        const osc = ctx.createOscillator();
        const rimGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

        rimGain.gain.setValueAtTime(0.7, now);
        rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(rimGain);
        rimGain.connect(gainNode);

        whiteNoise.start(now);
        osc.start(now);
        whiteNoise.stop(now + 0.15);
        osc.stop(now + 0.15);
        break;
      }

      case 'dramatic': {
        // Dun dun dunnnn chords
        const notes = [
          { time: 0, freq: 196.0, dur: 0.25 },
          { time: 0.3, freq: 185.0, dur: 0.25 },
          { time: 0.65, freq: 164.81, dur: 1.0 },
        ];
        notes.forEach(({ time, freq, dur }) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();
          osc1.type = 'sawtooth';
          osc2.type = 'square';
          osc1.frequency.setValueAtTime(freq, now + time);
          osc2.frequency.setValueAtTime(freq / 2, now + time);

          g.gain.setValueAtTime(0, now + time);
          g.gain.linearRampToValueAtTime(0.4, now + time + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc1.connect(g);
          osc2.connect(g);
          g.connect(gainNode);

          osc1.start(now + time);
          osc2.start(now + time);
          osc1.stop(now + time + dur + 0.05);
          osc2.stop(now + time + dur + 0.05);
        });
        break;
      }

      case 'boing': {
        // Cartoon spring boing
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.4);

        g.gain.setValueAtTime(0.8, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        // Add vibrato LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(20, now);
        lfoGain.gain.setValueAtTime(30, now);
        lfo.connect(osc.frequency);

        osc.connect(g);
        g.connect(gainNode);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.5);
        osc.stop(now + 0.5);
        break;
      }

      case 'scratch': {
        // Record scratch
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        g.gain.setValueAtTime(0.6, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(g);
        g.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'laser': {
        // Sci-Fi pew pew
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

        g.gain.setValueAtTime(0.6, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(g);
        g.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'applause': {
        // Cheering crowd / noise burst
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(1.5, now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.7, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        src.connect(filter);
        filter.connect(g);
        g.connect(gainNode);
        src.start(now);
        src.stop(now + 1.5);
        break;
      }

      case 'gasp': {
        // Sudden dramatic breath/chime
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(g);
        g.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.warn('SFX audio error:', e);
  }
}

// Play count-in metronome beep
export function playMetronomeBeep(isHigh = false) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, now);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    // Ignore context errors
  }
}

// Apply real-time voice FX chain to an AudioNode
export function applyVoiceEffectChain(
  ctx: AudioContext,
  sourceNode: AudioNode,
  effect: VoiceEffect,
  outputNode: AudioNode
) {
  if (effect === 'none') {
    sourceNode.connect(outputNode);
    return;
  }

  if (effect === 'villain') {
    // Low-pass filter + waveshaper saturation + sub-bass boost
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.setValueAtTime(250, ctx.currentTime);
    filter.gain.setValueAtTime(9.0, ctx.currentTime);

    const hiCut = ctx.createBiquadFilter();
    hiCut.type = 'lowpass';
    hiCut.frequency.setValueAtTime(3200, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(18);

    sourceNode.connect(filter);
    filter.connect(hiCut);
    hiCut.connect(shaper);
    shaper.connect(outputNode);
    return;
  }

  if (effect === 'chipmunk') {
    // High-pass resonance + treble boost
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(2800, ctx.currentTime);
    peak.gain.setValueAtTime(8.0, ctx.currentTime);

    sourceNode.connect(filter);
    filter.connect(peak);
    peak.connect(outputNode);
    return;
  }

  if (effect === 'robot') {
    // Ring Modulator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(1.0, ctx.currentTime);

    osc.connect(modGain.gain);
    sourceNode.connect(modGain);
    modGain.connect(outputNode);
    osc.start();
    return;
  }

  if (effect === 'radio') {
    // Bandpass 350Hz - 3200Hz + distortion
    const filterLow = ctx.createBiquadFilter();
    filterLow.type = 'highpass';
    filterLow.frequency.setValueAtTime(400, ctx.currentTime);

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = 'lowpass';
    filterHigh.frequency.setValueAtTime(2800, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(35);

    sourceNode.connect(filterLow);
    filterLow.connect(filterHigh);
    filterHigh.connect(shaper);
    shaper.connect(outputNode);
    return;
  }

  if (effect === 'reverb') {
    // Feedback delay pseudo-reverb
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.18, ctx.currentTime);

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.45, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    sourceNode.connect(outputNode); // dry
    sourceNode.connect(delay);
    delay.connect(outputNode); // wet
    return;
  }

  if (effect === 'megaphone') {
    // Sharp Mid boost + hard limit
    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(1800, ctx.currentTime);
    peak.gain.setValueAtTime(12.0, ctx.currentTime);
    peak.Q.setValueAtTime(2.0, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(50);

    sourceNode.connect(peak);
    peak.connect(shaper);
    shaper.connect(outputNode);
    return;
  }

  sourceNode.connect(outputNode);
}

function makeDistortionCurve(amount = 20) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

let activePreviewSourceNode: AudioBufferSourceNode | null = null;

export function stopTakePreview() {
  if (activePreviewSourceNode) {
    try {
      activePreviewSourceNode.stop();
      activePreviewSourceNode.disconnect();
    } catch (e) {
      // ignore
    }
    activePreviewSourceNode = null;
  }
}

export function playTakePreviewWithEffect(
  buffer: AudioBuffer,
  effect: VoiceEffect,
  volume = 1.0,
  onEnded?: () => void
): () => void {
  stopTakePreview();

  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);

  applyVoiceEffectChain(ctx, source, effect, gainNode);
  gainNode.connect(ctx.destination);

  activePreviewSourceNode = source;

  source.onended = () => {
    if (activePreviewSourceNode === source) {
      activePreviewSourceNode = null;
    }
    if (onEnded) onEnded();
  };

  source.start(0);

  return () => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {}
    if (activePreviewSourceNode === source) {
      activePreviewSourceNode = null;
    }
  };
}
