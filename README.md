# The Choice Voicer - Video Dubbing Game 🎙️🎭

**The Choice Voicer** is a collaborative, multiplayer video voiceover and dubbing party game built with React, TypeScript, Tailwind CSS, Express, and Google Gemini AI.

Capture any browser tab or screen with audio (YouTube, cartoons, memes, gameplay), record multi-person voiceover tracks with real-time DSP voice effects (Villain, Chipmunk, Robot, Megaphone, Radio, Reverb), generate comedic AI scripts and speaker diarization, drop live sound effects from a soundboard, and get evaluated by an AI Comedy Judge!

---

## 🌟 Key Features

- 🖥️ **Tab & Screen Recording with Audio**: Record video and audio directly from any browser tab or screen using the Web Screen Capture API (`getDisplayMedia`).
- 🤖 **Gemini AI Script & Speaker Diarization**:
  - Automatically transcribes speech from captured tab audio.
  - Diarizes speakers into character roles with timed lines and acting delivery cues.
  - Generates custom comedy dub scripts on demand across multiple genres.
- 🎛️ **Real-Time Voice Effects**:
  - Web Audio API DSP filter chain: *Normal*, *Villain (Pitch Down + Distortion)*, *Chipmunk (Pitch Up + Highpass)*, *Robot (Ring Modulation & Carrier Oscillation)*, *Radio (Bandpass AM Lo-Fi)*, *Megaphone (Overdrive + Resonant Filter)*, and *Reverb (Algorithmic Impulse Convolver)*.
  - Live audio preview for each player.
- 🎬 **Multi-Track Timeline & Audio Mixer**:
  - Visual waveform displays for each actor's recorded take.
  - Per-track Volume, Solo, and Mute toggles.
  - Voice Activity Detection (VAD) analysis for automatic speech segment detection.
  - Background audio handling: Keep original audio, Duck during voiceovers, or completely Mute.
- 📜 **Synchronized Teleprompter**:
  - Live karaoke-style script prompter highlighting active dialogue lines as the video plays.
- 🔊 **Built-in Procedural Soundboard**:
  - Instant SFX triggers (Vine Boom, Rimshot, Airhorn, Dramatic Chord, Laser, Boing, Record Scratch, Applause, Gasp) synthesized directly via Web Audio oscillators without external asset dependencies.
  - Keyboard hotkeys (`1`–`9`) for live performance timing.
- 🏆 **AI Comedy Judge / Critic**:
  - Multi-personality comedy evaluation (Gordon Ramsay of Voice Acting, Sarcastic Cinema Critic, Chaotic Hype Beast).
  - Individual score breakdown, standout moments, and party winner awards.
- 💾 **Client-Side Video & Audio Compositing Export**:
  - Mixes video canvas frames with all active audio tracks and sound effects into a downloadable WebM video file.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js**: Version 18.0.0 or higher (v20+ recommended) or **Bun**.
- **npm** (included with Node) or **bun** / **yarn** / **pnpm**.
- *(Optional)* A **Google Gemini API Key** for AI script generation, audio diarization, and AI judge scoring. (The app includes high-quality built-in fallbacks if no API key is provided).

---

### Step-by-Step Setup

1. **Clone or Download the Project**:
   ```bash
   git clone <repository-url>
   cd choice-voicer
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   *(or with Bun: `bun install`)*

3. **Configure Environment Variables**:
   Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```

   Open `.env` and configure your settings:
   ```env
   # Google Gemini API Key (Get one from https://aistudio.google.com/)
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # Local server URL
   APP_URL="http://localhost:3000"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware in development mode using `tsx`. |
| `npm run build` | Builds the React frontend (`vite build`) and bundles `server.ts` into `dist/server.cjs` using `esbuild`. |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`). |
| `npm run lint` | Runs TypeScript compiler checks (`tsc --noEmit`). |
| `npm run clean` | Removes build artifacts (`dist` folder). |

---

## 📖 How to Play / Use the App

### 1. Choose or Capture a Video Clip
- **Capture Browser Tab / Screen**: Click **"Capture Tab / Screen"** in the top bar. Select a tab playing a video (e.g. YouTube), ensure **"Share tab audio"** is checked in the browser picker, and record 5–30 seconds.
- **Transcribe & Diarize**: The audio from the tab is processed with Gemini AI to generate character roles and dialogue timestamps automatically!
- **Preset Clips**: Pick from built-in animated comedy scenes (Noir Detective, Sci-Fi Bridge, Cooking Show, Dragon Encounter, Sports Commentary).
- **Upload File**: Upload any MP4/WebM video file from your computer.

### 2. Configure Players & Characters
- Assign each player a character name, avatar color, and starting voice filter.
- Support for 1 to 4 simultaneous actors.

### 3. Record Voiceover Takes
- Select your active actor/character.
- Hit **"Record Take"** (with optional 3-2-1 metronome countdown).
- Speak into your microphone following the on-screen script prompter!
- Re-record or layer multiple takes across different characters.

### 4. Mix & Apply Real-Time Effects
- Switch voice effects on the fly (Villain, Robot, Chipmunk, etc.).
- Adjust take volume or solo/mute tracks on the multi-track timeline.
- Trigger soundboard SFX with keyboard number keys (`1`–`9`).

### 5. AI Judge Evaluation & Export
- Click **"AI Judge"** to have an AI critic review your timing, vocal energy, and performance.
- Click **"Export Video"** to render and download your final dubbed video.

---

## 🔒 Security & API Notes

- All Gemini API calls are proxied securely through server-side endpoints in `server.ts`.
- The `GEMINI_API_KEY` is never exposed to the client-side browser bundle.
- The app operates fully even without an API key by using intelligent offline fallbacks and procedural generators.

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for personal and party gaming fun!
