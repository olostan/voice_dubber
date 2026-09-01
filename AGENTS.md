# AGENTS.md - Architecture, Internal Mechanics & Agent Guidelines

This document provides a comprehensive technical overview of **The Choice Voicer - Video Dubbing Game** for AI agents, developers, and maintainers working on this codebase.

---

## 1. System Overview & Technology Stack

The application is structured as a full-stack web application running an **Express.js** backend integrated with a **React 19 + Vite** frontend.

### Core Stack
- **Frontend**: React 19, TypeScript (~5.8.2), Tailwind CSS (v4), Motion (`motion/react`), Lucide React icons, Canvas Confetti.
- **Backend / Server**: Node.js, Express 4.x, TypeScript runtime via `tsx` (dev) and bundled via `esbuild` to CommonJS (`dist/server.cjs` for production).
- **AI SDK**: `@google/genai` (Google Gen AI SDK v2.4+) utilizing `gemini-3.7-flash`, `gemini-flash-latest`, and `gemini-3.5-transcribe` with retry logic and offline fallbacks.
- **Audio Processing**: Web Audio API (native browser DSP nodes, convolvers, biquad filters, dynamics compressors, wave shapers, and procedural synth oscillators).
- **Video Capture & Canvas**: HTML5 Canvas 2D, Web Screen Capture API (`getDisplayMedia`), MediaRecorder API, HTMLVideoElement sync.

---

## 2. Directory Structure & File Map

```
├── .env.example                     # Environment variables schema
├── bun.lock / package.json          # Dependencies & build scripts
├── metadata.json                    # Application metadata, permissions & capabilities
├── server.ts                        # Express API server + Vite dev/production middleware
├── tsconfig.json / vite.config.ts   # TypeScript & Vite configuration
├── README.md                        # User setup guide & local run instructions
├── AGENTS.md                        # Architectural and technical documentation (this file)
└── src/
    ├── main.tsx                     # React DOM entry point
    ├── index.css                    # Tailwind CSS v4 entry point (@import "tailwindcss";)
    ├── types.ts                     # Core domain interfaces & type definitions
    ├── App.tsx                      # Root component: orchestrates state, playback loop, modals
    ├── components/
    │   ├── Header.tsx               # Top navigation bar, mode switcher, action triggers
    │   ├── VideoCanvasPlayer.tsx    # Video / Canvas playback engine with live VU & subtitles
    │   ├── MultiTrackTimeline.tsx   # Multi-lane timeline, waveform rendering, track controls
    │   ├── RecordingControls.tsx    # Record/Stop/Pause, 3-2-1 countdown, active take status
    │   ├── ScriptPrompter.tsx       # Teleprompter / karaoke script follower with cue markers
    │   ├── VoiceEffectsSelector.tsx # DSP voice effect previewer & assignment panel
    │   ├── Soundboard.tsx           # Procedural Web Audio SFX pads with keyboard hotkeys
    │   ├── ClipSelector.tsx         # Modal / picker for preset animated clips & file uploads
    │   ├── ActiveTabRecordingModal.tsx # Fullscreen capture flow for recording browser tab + audio
    │   ├── WelcomeCapturePrompt.tsx # Initial prompt guiding users to capture tab or pick a clip
    │   ├── PlayerSetupModal.tsx     # Player roster, character assignment, color selection
    │   ├── AiJudgeModal.tsx         # AI comedy critic evaluation scoreboard
    │   └── ExportModal.tsx          # Client-side video/audio compositor & download generator
    └── utils/
        ├── audioEngine.ts           # Web Audio API engine: DSP filters, VAD, WAV encoder, synth SFX
        ├── videoCapture.ts          # Screen/tab capture session manager & microphone recorder
        └── presetClips.ts           # Procedural canvas scenes (Noir, Sci-Fi, Cooking, Dragon, Sports)
```

---

## 3. Backend Architecture (`server.ts`)

The backend runs on port 3000 (`0.0.0.0`) and provides secure server-side API proxy routes for Gemini AI capabilities, keeping the `GEMINI_API_KEY` hidden from the client browser.

### API Endpoints

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint returning `{ status: "ok", hasGeminiKey: boolean }`. |
| `/api/gemini/generate-script` | `POST` | Generates a structured comedic dubbing script for given characters and duration. |
| `/api/gemini/suggest-characters` | `POST` | Suggests character profiles, voice styles, and color themes tailored to a clip. |
| `/api/gemini/ai-judge` | `POST` | Evaluates player takes, scores performance, and awards badges using custom judge personas. |
| `/api/gemini/transcribe-and-diarize` | `POST` | Receives base64 audio from captured tab video, diarizes speakers, and generates timestamped lines. |
| `/api/gemini/transcribe` | `POST` | Performs standard speech-to-text on an audio payload. |

### Robustness Patterns
- **Exponential Backoff (`callGeminiWithRetry`)**: Automatically catches transient `503`, `UNAVAILABLE`, and `429` rate-limit errors and retries with progressive delay.
- **Model Fallbacks**: For audio diarization, the server first attempts `gemini-3.7-flash`, falls back to `gemini-flash-latest`, and falls back to synthesized timeline heuristics if cloud calls fail.
- **Graceful Fallbacks**: If `GEMINI_API_KEY` is not present, all endpoints return high-quality offline structured payloads so the application remains 100% playable.

---

## 4. Frontend Subsystems & Data Flow

### 4.1. Core Data Models (`src/types.ts`)
- **`AudioTake`**: Represents an individual vocal recording for a specific player/character, including `audioBlob`, `audioBuffer`, `startTimeOffset`, `volume`, `muted`, `solo`, `effect`, and `waveformData`.
- **`Character`**: Metadata for a scene character (`id`, `name`, `voiceStyle`, `color`, `avatarIcon`, `suggestedPitch`).
- **`Player`**: Represents a physical user assigned to a character (`id`, `name`, `characterId`, `avatarColor`, `voiceEffect`, `score`).
- **`ScriptData` & `ScriptLine`**: Structured script containing lines with `startTime`, `endTime`, `speakerId`, `text`, and acting `cue`.
- **`VideoSource`**: Unified video handle for screen/tab captures (`screen_capture`), built-in canvas scenes (`preset`), or uploaded files (`upload`).

### 4.2. Audio Engine (`src/utils/audioEngine.ts`)

The Web Audio API pipeline is designed to work with zero external MP3/WAV assets:

1. **DSP Voice Effect Chains (`applyVoiceEffectChain`)**:
   - **`villain`**: Lowpass filter (800Hz) + Waveshaper non-linear distortion + Biquad low-shelf boost.
   - **`chipmunk`**: Highpass filter (1400Hz) + Peaking filter (3.2kHz) for bright, punchy squeak tones.
   - **`robot`**: Ring modulation using an internal OscillatorNode (50Hz sine carrier) multiplied with the voice signal via a GainNode.
   - **`radio`**: Bandpass filtering (500Hz–2.5kHz) with aggressive compression and subtle saturation.
   - **`megaphone`**: High-gain overdrive + Resonant bandpass (1.2kHz, Q=4.0) with clipping.
   - **`reverb`**: Algorithmic impulse response generated in memory (exponential decaying noise) routed through a `ConvolverNode`.

2. **Voice Activity Detection (`detectVoiceSegments`)**:
   - Analyzes PCM sample windows (20ms frames) computing RMS power against adaptive thresholds with hangover frames to produce timestamped speech intervals (`{ start, end }`).

3. **WAV Encoder (`audioBufferToWav`)**:
   - Converts standard Web Audio `AudioBuffer` objects into 16-bit PCM WAV Blobs with correct RIFF headers for export and playback.

4. **Procedural Soundboard Synthesizer (`playSoundEffect`)**:
   - Synthesizes 9 distinct sound effects (Vine Boom, Rimshot, Airhorn, Dramatic chord, Applause noise burst, Boing pitch bend, Scratch filter sweeps, Laser sweeps, Gasp envelope) purely in JavaScript using Web Audio nodes.

### 4.3. Video Capture & Canvas Synchronization (`src/utils/videoCapture.ts`, `src/components/VideoCanvasPlayer.tsx`)

1. **Tab Capture**:
   - Uses `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true })`.
   - Records chunks with `MediaRecorder` (`video/webm;codecs=vp9,opus` or `vp8,opus`).
   - Extracts the audio track into an `AudioBuffer` and automatically calls `/api/gemini/transcribe-and-diarize` to bootstrap characters and lines.

2. **Playback Loop**:
   - Synchronized via `requestAnimationFrame` and `HTMLVideoElement.currentTime`.
   - For preset animated scenes (`presetClips.ts`), 2D procedural rendering animates dynamic backgrounds, character silhouettes, facial expressions, and weather effects matching the playback timestamp.

3. **Composite Video Export (`src/components/ExportModal.tsx`)**:
   - Renders the video canvas onto an offscreen canvas.
   - Creates a unified `AudioContext` destination combining original video audio (with ducking/muting support) and all active `AudioTake` audio buffers routed through their respective DSP filter chains.
   - Records the combined `MediaStream` into a downloadable WebM video file.

---

## 5. Agent Modification Guidelines

When extending or modifying this project, adhere to the following conventions:

1. **Maintain Full-Stack API Isolation**:
   - Never make Gemini API calls directly from client-side React components.
   - Always route AI calls through `/api/gemini/*` endpoints in `server.ts`.
   - Keep `.env.example` in sync if new environment variables are added.

2. **Web Audio Context Lifecycle**:
   - AudioContexts are lazily initialized and resumed on user interaction via `getAudioContext()`.
   - Ensure audio nodes are disconnected or cleaned up when stopping takes or changing effects to prevent memory leaks.

3. **Responsive UI & Styling**:
   - Style components with Tailwind CSS utility classes.
   - Use Lucide icons (`lucide-react`) for UI icons.
   - Maintain high color contrast and responsive layouts (mobile-friendly controls + desktop-expanded timeline).

4. **Verification**:
   - Always verify TypeScript types and compilation using `npm run lint` (`tsc --noEmit`) and `npm run build`.
