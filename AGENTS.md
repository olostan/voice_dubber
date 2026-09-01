# AGENTS.md - Architecture, Internal Mechanics & Agent Guidelines

This document provides a comprehensive technical overview of **Voice Dubber - Video Dubbing Game** for AI agents, developers, and maintainers working on this codebase.

---

## 1. System Overview & Technology Stack

The application is built with a decoupled modern web architecture:

### Core Stack
- **Frontend**: React 19, TypeScript (~5.8.2), Tailwind CSS (v4), Motion (`motion/react`), Lucide React icons, Canvas Confetti.
- **Backend / Cloud Functions**:
  - **Local Development**: Express 4.x runtime via `tsx` on `http://localhost:3000`.
  - **Production Deployment**: Firebase Cloud Functions v2 (`functions/src/index.ts`) with strict TypeScript compilation.
- **AI SDK**: `@google/genai` (Google Gen AI SDK v2.4+) utilizing `gemini-3.7-flash`, `gemini-flash-latest`, and `gemini-3.5-transcribe` with retry logic and offline fallbacks.
- **Database & Cloud Services**: Cloud Firestore (NoSQL document store), Firebase Authentication (Google OAuth + Anonymous), Firebase Hosting CDN edge.
- **Local Client Storage**: Browser IndexedDB for instant, zero-lag offline recovery of binary video blobs and 16-bit PCM vocal takes.
- **Audio Processing**: Web Audio API (native browser DSP nodes, convolvers, biquad filters, dynamics compressors, wave shapers, and procedural synth oscillators).
- **Video Capture & Canvas**: HTML5 Canvas 2D, Web Screen Capture API (`getDisplayMedia`), MediaRecorder API, HTMLVideoElement sync.

---

## 2. Directory Structure & File Map

```
├── .env.example                     # Environment variables schema
├── .firebaserc                      # Firebase project alias mapping
├── firebase.json                    # Firebase Hosting, Functions, and Firestore configuration
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore database indexes
├── package.json                     # Root dependencies & build scripts
├── README.md                        # User setup guide & zero-to-production instructions
├── AGENTS.md                        # Architectural and technical documentation (this file)
├── server.ts                        # Local Express API server + Vite middleware
├── vite.config.ts                   # Vite configuration
├── functions/                       # Firebase Cloud Functions backend
│   ├── package.json                 # Cloud Functions dependencies
│   ├── tsconfig.json                # Strict TypeScript configuration
│   └── src/
│       └── index.ts                 # Cloud Function endpoints (Gemini AI + Firestore API)
└── src/
    ├── main.tsx                     # React DOM entry point
    ├── index.css                    # Tailwind CSS v4 entry point
    ├── types.ts                     # Core domain interfaces & type definitions
    ├── vite-env.d.ts                # Vite environment typings
    ├── App.tsx                      # Root component: orchestrates state, playback loop, modals
    ├── components/
    │   ├── Header.tsx               # Top navigation bar, Google Auth profile, My Dubs trigger
    │   ├── VideoCanvasPlayer.tsx    # Video / Canvas playback engine with live VU & subtitles
    │   ├── MultiTrackTimeline.tsx   # Multi-lane timeline, waveform rendering, drag-to-move takes
    │   ├── RecordingControls.tsx    # Record/Stop/Pause, 3-2-1 countdown, active take status
    │   ├── ScriptPrompter.tsx       # Teleprompter / karaoke script follower with cue markers
    │   ├── VoiceEffectsSelector.tsx # DSP voice effect previewer & assignment panel
    │   ├── Soundboard.tsx           # Procedural Web Audio SFX pads with keyboard hotkeys
    │   ├── ClipSelector.tsx         # Modal / picker for preset animated clips & file uploads
    │   ├── ActiveTabRecordingModal.tsx # Fullscreen capture flow for recording browser tab + audio
    │   ├── WelcomeCapturePrompt.tsx # Initial prompt guiding users to capture tab or pick a clip
    │   ├── MyProjectsModal.tsx      # User cloud dub project manager (list, open, edit, delete)
    │   ├── AiJudgeModal.tsx         # AI comedy critic evaluation scoreboard
    │   └── ExportModal.tsx          # Client-side video/audio compositor & download generator
    └── utils/
        ├── audioEngine.ts           # Web Audio API engine: DSP filters, VAD, WAV encoder, synth SFX
        ├── videoCapture.ts          # Screen/tab capture session manager & microphone recorder
        ├── persistence.ts           # Client-side IndexedDB persistence engine for Blobs and takes
        ├── auth.ts                  # Firebase Google Authentication & ID Token management
        ├── cloudSync.ts             # Zero-auth REST client for Cloud Firestore project synchronization
        └── presetClips.ts           # Procedural canvas scenes (Noir, Sci-Fi, Cooking, Dragon, Sports)
```

---

## 3. Backend & Cloud Functions Architecture (`functions/src/index.ts`, `server.ts`)

The backend exposes a secure REST API for AI operations and database synchronization:

### API Endpoints

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint returning `{ status: "ok", hasGeminiKey: boolean, firestoreEnabled: boolean }`. |
| `/api/user/projects` | `GET` | Returns all cloud projects owned by the authenticated user (`authorId == user.uid`). |
| `/api/projects` | `POST` | Saves or creates a dubbing project in Firestore with author attribution. |
| `/api/projects/:id` | `GET` | Retrieves a public or private dubbing project by its unique share ID. |
| `/api/projects/:id` | `PUT` | Updates project title, genre, or contents if owned by the user. |
| `/api/projects/:id` | `DELETE` | Deletes a project document from Firestore. |
| `/api/community-dubs` | `POST` | Publishes a dubbing score and performance to the Community Hall of Fame. |
| `/api/community-dubs` | `GET` | Returns recent community dub submissions. |
| `/api/gemini/generate-script` | `POST` | Generates a structured comedic dubbing script for given characters and duration. |
| `/api/gemini/suggest-characters` | `POST` | Suggests character profiles, voice styles, and color themes tailored to a clip. |
| `/api/gemini/ai-judge` | `POST` | Evaluates player takes, scores performance, and awards badges using custom judge personas. |
| `/api/gemini/transcribe-and-diarize` | `POST` | Receives base64 audio from captured tab video, diarizes speakers, and generates timestamped lines. |

### Security & Privacy Principles
1. **Zero Client-Side Credentials**:
   - The React frontend makes REST calls to `/api/*` without storing backend keys or service account secrets.
2. **Bearer Token Authentication**:
   - Protected endpoints verify user identity via `admin.auth().verifyIdToken(token)` passed in the `Authorization: Bearer <token>` header.
3. **OAuth Authorized Domains**:
   - Both `localhost` and `127.0.0.1` must be registered in Firebase Auth Authorized Domains (via Identity Platform API or Firebase Console) to allow local development sign-in without domain restriction errors.
4. **Application Default Credentials (ADC)**:
   - On Firebase Cloud Functions, `firebase-admin` automatically accesses Firestore and Auth using native GCP service account permissions.
5. **Secret Manager**:
   - The `GEMINI_API_KEY` is injected via Google Cloud Secret Manager (`secrets: ["GEMINI_API_KEY"]`).

---

## 4. Frontend Subsystems & Data Flow

### 4.1. Dual Persistence Architecture
1. **IndexedDB Local Storage (`src/utils/persistence.ts`)**:
   - High-capacity client database (`voice_dubber_db`).
   - Automatically serializes and caches video `Blob` handles, 16-bit PCM vocal takes, waveforms, and prompter lines.
   - Restores the entire working session on page reload instantly with zero network latency.
2. **Cloud Firestore Sync (`src/utils/cloudSync.ts`)**:
   - Saves project metadata, characters, and diarized lines to Firestore.
   - Generates shareable URL routes (`/?project=<shareId>`) allowing collaborators to load projects on any device.

### 4.2. Audio Processing Engine (`src/utils/audioEngine.ts`)
1. **DSP Voice Chains**:
   - **`villain`**: Lowpass filter (800Hz) + Waveshaper non-linear distortion + Biquad low-shelf boost.
   - **`chipmunk`**: Highpass filter (1400Hz) + Peaking filter (3.2kHz) for punchy squeak tones.
   - **`robot`**: Ring modulation using an internal OscillatorNode (50Hz sine carrier) multiplied via GainNode.
   - **`radio`**: Bandpass filtering (500Hz–2.5kHz) with aggressive dynamic compression.
   - **`megaphone`**: High-gain overdrive + Resonant bandpass (1.2kHz, Q=4.0) with clipping.
   - **`reverb`**: ConvolverNode loaded with algorithmic exponential-decay noise impulses.
2. **Audio Ducking Pipeline**:
   - `duck_10` (Default): Video audio reduced to 10% whenever dub takes exist or during active recording.
   - `smart_duck`: Dynamically ducks original audio during speech intervals and restores 100% during pauses.

### 4.3. Line-by-Line Dubbing & Next-Actor Prompter Loop
- When recording a specific line (`targetRecordingLine`), the playback animation frame loop monitors `currentTime`.
- When `currentTime >= line.endTime + 0.35`, the app automatically stops recording, calculates `takeStartOffset`, saves the take, and queues `nextPendingLine`.
- The **Next Actor Prompter Banner** prompts the next user with their lines; pressing **Space** begins the next take.

---

## 5. Agent Modification Guidelines

When extending or modifying this project, adhere to the following rules:

1. **Strict TypeScript & Code Quality**:
   - Maintain `strict: true`, `noImplicitAny: true`, and `noUnusedLocals: true` in all TypeScript files.
   - Never introduce `any` types or disable strict checks.

2. **Full-Stack API Isolation**:
   - Never make direct AI calls or raw database queries from React components.
   - Always route server operations through `/api/*` endpoints in `functions/src/index.ts` and `server.ts`.

3. **Public Repository Security**:
   - Never hardcode API keys, service accounts, or private tokens in any tracked file.

4. **Verification**:
   - Always verify compilation with `npm run lint` and `npm --prefix functions run build`.

---

## 6. Automated Project Provisioning & Bootstrap Playbook (For AI Agents)

When a user prompts you with *"Setup this project"*, *"Bootstrap environment"*, or *"Connect to my Firebase project"*, follow this automated playbook step-by-step:

### Step 1: Install Dependencies
```bash
npm install
npm --prefix functions install
```

### Step 2: Environment Configuration
- If `.env` is missing, copy `.env.example` to `.env`:
  ```bash
  cp .env.example .env
  ```
- If the user provides a `GEMINI_API_KEY`, populate it in `.env`. Otherwise, note that the application operates in graceful offline fallback mode.

### Step 3: Firebase Project Discovery & Linking
- Discover available Firebase projects:
  ```bash
  npx -y firebase-tools@latest projects:list
  ```
- Link the project alias in `.firebaserc` or run:
  ```bash
  npx -y firebase-tools@latest use <PROJECT_ID>
  ```
- Verify `projectId` matches in `src/utils/auth.ts` and `firebase.json`.

### Step 4: Provision Firestore Database & Security Rules
- Create the default Firestore database if it doesn't already exist:
  ```bash
  npx -y firebase-tools@latest firestore:databases:create "(default)" --location="nam5"
  ```
- Deploy Firestore security rules and indexes:
  ```bash
  npx -y firebase-tools@latest deploy --only firestore
  ```

### Step 5: Provision Firebase Auth & Whitelist Authorized Domains
1. Deploy Google Sign-In and Anonymous Auth providers:
   ```bash
   npx -y firebase-tools@latest deploy --only auth
   ```
2. Automatically add `localhost` and `127.0.0.1` to the Authorized Domains list using Google Cloud Identity Platform API:
   ```bash
   curl -s -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/<PROJECT_ID>/config?updateMask=authorizedDomains" \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "x-goog-user-project: <PROJECT_ID>" \
     -H "Content-Type: application/json" \
     -d '{"authorizedDomains": ["localhost", "127.0.0.1", "<PROJECT_ID>.firebaseapp.com", "<PROJECT_ID>.web.app"]}'
   ```

### Step 6: Verify Build & Launch Development Server
- Run TypeScript checks:
  ```bash
  npm run lint && npm --prefix functions run build
  ```
- Launch the development server on `http://localhost:3000`:
  ```bash
  npm run dev
  ```
- Inform the user that the studio is ready at [http://localhost:3000](http://localhost:3000).
