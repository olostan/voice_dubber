# Voice Dubber - Video Dubbing Game 🎙️🎭

**Voice Dubber** is a collaborative video voiceover and dubbing party game built with React 19, TypeScript, Tailwind CSS, Web Audio API, Firebase (Hosting, Auth, Firestore, Cloud Functions), and Google Gemini AI.

Capture any browser tab or screen with sound (YouTube, memes, cartoons, gameplay), record multi-character voiceover takes with real-time DSP voice effects (Villain, Chipmunk, Robot, Radio, Megaphone, Reverb), generate comedic AI scripts and auto-transcriptions, fine-tune timeline waveforms, drop live soundboard SFX, and get scored by an AI Comedy Judge!

---

## 🌟 Key Features

- 🖥️ **Tab & Screen Recording with Audio**: Record video and audio directly from any browser tab or window using the Web Screen Capture API (`getDisplayMedia`).
- 🤖 **Gemini AI Script & Speaker Diarization**:
  - Automatically extracts and transcribes dialogue from captured video audio.
  - Diarizes speakers into character roles with timed lines and acting delivery cues.
  - Generates custom comedy dub scripts across multiple genres.
- 🎛️ **Real-Time DSP Voice Effects**:
  - Web Audio API DSP filter chain: *Normal*, *Villain (Pitch Down + Distortion)*, *Chipmunk (Pitch Up + Highpass)*, *Robot (Ring Modulation & Carrier Oscillation)*, *Radio (Bandpass AM Lo-Fi)*, *Megaphone (Overdrive + Resonant Filter)*, and *Reverb (Algorithmic Impulse Convolver)*.
- 🎬 **Multi-Track Timeline & Waveform Editor**:
  - Horizontal **drag-to-move** audio takes along timeline lanes to fine-tune sync.
  - Per-track Volume, Solo, Mute, and DSP effect assignment.
  - **Original Audio Treatment**: 10% ducking by default, 25%, Mute (0%), 100% Original, or dynamic Smart Ducking.
- 📜 **Interactive Teleprompter & Line-by-Line Dubbing**:
  - Click any dialogue line to jump the video playhead directly to that cue.
  - Dedicated **"Record / Re-record"** buttons with 3-2-1 lead-in metronome.
  - **Auto-pauses** when line recording finishes and queues the next actor with Spacebar continuity.
- 💾 **Dual-Layer Persistence**:
  - **Local IndexedDB**: Instant offline reload — preserves captured video blobs, recorded takes, script lines, and settings across browser refreshes.
  - **Cloud Firestore**: Save and manage dubbing projects in the cloud and share them via 1-click shareable links (`/?project=<shareId>`).
- 🔐 **Google Authentication**:
  - 1-click Google Sign-In with popup.
  - **"My Dubs"** Project Manager: Open, rename, delete, and organize all your personal dub projects.
- 🏆 **AI Comedy Judge & Export**:
  - Multi-personality comedy evaluation with personalized actor feedback and awards.
  - Client-side video/audio compositor exporting full WebM video downloads.

---

## 🔒 Security Architecture (Public Repo Safe)

This project is designed for open-source public GitHub repositories:
- **Zero Client Secrets**: No API keys, database credentials, or service account tokens exist in the client-side JavaScript bundle.
- **Server-Side AI Proxy & Cloud Functions**: All Gemini AI calls and Firestore writes are handled strictly on the backend (`functions/src/index.ts` / `server.ts`) using Google Cloud **Application Default Credentials (ADC)** and secret environment variables.
- **Client Auth Tokens**: Requests to protected routes send short-lived Firebase Auth ID Tokens (`Authorization: Bearer <token>`) verified cryptographically on the server.

---

## ⚡ 1-Click Automated Setup with AI Agents

If you are using an AI coding assistant (such as **Google Antigravity**, **Codex**, **Claude Code**, or **Gemini Code Assist**), you can automate the entire project setup with a single prompt!

Simply open this repository in your AI coding assistant and say:

> **"Set up this project from scratch: install dependencies, configure environment, and connect to my Firebase project."**

The AI assistant will automatically read the playbook in [`AGENTS.md`](file:///Users/olostan/code/voice_dubber/AGENTS.md), install all dependencies, configure environment templates, provision Firestore, enable Google Sign-In, and authorize `localhost` automatically.

---

## 🚀 Manual Setup Guide from Scratch (0 to Running)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm** (included with Node.js) or **bun**.
- *(Optional)* A free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/voice_dubber.git
cd voice_dubber

# Install root dependencies
npm install

# Install Cloud Functions dependencies
npm --prefix functions install
```

---

### 3. Configure Local Environment
Copy the `.env.example` template:
```bash
cp .env.example .env
```

Open `.env` and fill in your Gemini API key:
```env
# Google Gemini API Key
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Local Server Port
PORT=3000
```

---

### 4. Firebase Project Setup (Free Spark Plan)

You can connect the app to your own Firebase project in a few simple steps:

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project** (e.g. `my-voice-dubber`).

2. **Log in to Firebase CLI**:
   ```bash
   npx -y firebase-tools@latest login
   ```

3. **Link Your Project**:
   Update `.firebaserc` or set your active project:
   ```bash
   npx -y firebase-tools@latest use <YOUR_PROJECT_ID>
   ```

4. **Enable Firestore Database**:
   ```bash
   npx -y firebase-tools@latest firestore:databases:create "(default)" --location="nam5"
   ```

5. **Deploy Firestore Rules & Google Authentication**:
   ```bash
   # Deploy Firestore security rules and indexes
   npx -y firebase-tools@latest deploy --only firestore

   # Deploy Google Sign-In & Anonymous Auth configuration
   npx -y firebase-tools@latest deploy --only auth
   ```

6. **Authorize `localhost` for Google Auth**:
   - **Via Firebase Console**: In [Firebase Console](https://console.firebase.google.com/) -> **Authentication** -> **Settings** -> **Authorized domains** -> Click **Add domain** -> enter `localhost`.
   - **Or via CLI/API**:
     ```bash
     curl -s -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/<YOUR_PROJECT_ID>/config?updateMask=authorizedDomains" \
       -H "Authorization: Bearer $(gcloud auth print-access-token)" \
       -H "x-goog-user-project: <YOUR_PROJECT_ID>" \
       -H "Content-Type: application/json" \
       -d '{"authorizedDomains": ["localhost", "127.0.0.1", "<YOUR_PROJECT_ID>.firebaseapp.com", "<YOUR_PROJECT_ID>.web.app"]}'
     ```

---

### 5. 💻 Local Development Flow

#### Starting the Dev Server
To start the app locally with instant hot-reloading:
```bash
npm run dev
```

The terminal will display:
```
  🎙️ Voice Dubber Studio running at:
  > Local:   http://localhost:3000
```

#### Opening the App
1. Open your browser and navigate to **`http://localhost:3000`**.
2. **Important Note on Browser Permissions**: Always use `http://localhost:3000` (not raw IP like `http://192.168.x.x:3000`) for local testing. The browser's Web Screen Capture API (`getDisplayMedia`) and microphone access require a secure origin (`localhost` or HTTPS).

#### What Happens Under the Hood in Dev Mode:
- **Frontend**: Vite serves the React 19 application with lightning-fast Hot Module Replacement (HMR). Any changes in `src/` reflect instantly in the browser.
- **Backend API**: The dev server serves `/api/*` endpoints for Gemini AI script generation, voice diarization, and cloud project sync.
- **Offline / Zero-Key Support**: If no `GEMINI_API_KEY` is provided in `.env`, the app automatically falls back to intelligent procedural generators and preset clips so development never blocks.
- **Local Persistence**: Working takes, captured video blobs, and settings are saved automatically to your browser's IndexedDB database (`voice_dubber_db`).

#### Optional: Running with Firebase Local Emulators
If you want to test Cloud Functions and Firestore locally inside the official Firebase Emulator suite:
```bash
# 1. Build Cloud Functions
npm --prefix functions run build

# 2. Start Firebase Emulators (Firestore: 8080, Functions: 5001, Hosting: 5000)
npx -y firebase-tools@latest emulators:start
```

---

### 6. Deploying to Firebase (Production)

To deploy the entire stack to Firebase Hosting and Firebase Cloud Functions:

1. **Build Frontend & Functions**:
   ```bash
   npm run build
   npm --prefix functions run build
   ```

2. **Set your Gemini API Secret in Cloud Functions**:
   ```bash
   npx -y firebase-tools@latest functions:secrets:set GEMINI_API_KEY
   ```

3. **Deploy Everything**:
   ```bash
   npx -y firebase-tools@latest deploy
   ```

Firebase will output your live production URL:
`https://<YOUR_PROJECT_ID>.web.app`

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Express server with Vite middleware on `http://localhost:3000`. |
| `npm run build` | Builds production React bundle (`dist/`) and bundles `server.ts` to `dist/server.cjs`. |
| `npm run lint` | Runs TypeScript checks (`tsc --noEmit`) in strict mode. |
| `npm --prefix functions run build` | Compiles Firebase Cloud Functions TypeScript in `functions/lib/`. |
| `npm start` | Runs the production Node server (`node dist/server.cjs`). |

---

## 📖 How to Play & Dub

1. **Import or Record a Scene**:
   - Click **"Capture Tab / Screen"** (make sure to check **"Share tab audio"** in the browser prompt) to record 10–30s of any video.
   - Or click **"Animated Presets"** to pick a built-in comedy scene.
2. **Auto-Transcribe & Generate Lines**:
   - Gemini AI automatically transcribes dialogue and assigns character tracks.
3. **Record Character Lines**:
   - Click **"Record Line"** on any script cue or hit **Spacebar**.
   - Speak your lines into the mic with real-time voice filters!
   - Video automatically pauses when the line ends and arms the next actor.
4. **Mix & Adjust**:
   - Drag audio blocks on the timeline to fine-tune sync.
   - Adjust original audio ducking (10% ambient default).
   - Drop soundboard SFX with number keys `1`–`9`.
5. **Score & Share**:
   - Click **"AI Judge"** for a comedy review.
   - Click **"Save & Share"** to generate a cloud link or **"Export Dub"** to download the final video.

---

## 🔧 Troubleshooting

### `Firebase: Error (auth/unauthorized-domain)`
If you see this error when clicking **"Sign In with Google"** on `localhost:3000`:
1. Go to the [Firebase Console Authentication Settings](https://console.firebase.google.com/u/0/project/fun-voice-dubber/authentication/settings).
2. Click the **Settings** tab at the top.
3. In the **Authorized domains** list, check if `localhost` is listed.
4. If missing, click **Add domain**, type `localhost`, and click **Add**.
5. Return to `http://localhost:3000` and retry signing in.

---

## 📄 License

MIT License. Built for creators, animators, voice actors, and party game lovers!
