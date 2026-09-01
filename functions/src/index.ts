import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import express, { Request, Response } from "express";

// Initialize Firebase Admin SDK (Google Cloud Application Default Credentials automatically attached)
if (getApps().length === 0) {
  initializeApp();
}

const app = express();
app.use(express.json({ limit: "50mb" }));

const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET || "fun-voice-dubber-media";

function getMediaBucket() {
  try {
    return getStorage().bucket(MEDIA_BUCKET_NAME);
  } catch {
    return null;
  }
}

// Lazy loader for Google GenAI SDK to ensure zero-lag instant container startup
let genaiModule: typeof import("@google/genai") | null = null;
async function getGeminiSdk() {
  if (!genaiModule) {
    genaiModule = await import("@google/genai");
  }
  return genaiModule;
}

function getFirestoreDb(): Firestore | null {
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

async function getGeminiClient(): Promise<import("@google/genai").GoogleGenAI | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const { GoogleGenAI } = await getGeminiSdk();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface CharacterModel {
  id: string;
  name: string;
  voiceStyle: string;
  color: string;
  avatarIcon: string;
}

interface ScriptLineModel {
  id: string;
  speakerId: string;
  speakerName: string;
  startTime: number;
  endTime: number;
  text: string;
  cue: string;
}

interface ProjectDataModel {
  shareId?: string;
  title: string;
  synopsis?: string;
  genre?: string;
  duration?: number;
  characters?: CharacterModel[];
  lines?: ScriptLineModel[];
  authorId?: string | null;
  authorName?: string;
  authorEmail?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

interface CommunityDubModel {
  id?: string;
  scriptTitle: string;
  genre: string;
  playersCount: number;
  score: number;
  grade: string;
  badgeAwarded?: string;
  reviewCommentary?: string;
  authorName: string;
  createdAt?: number;
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1200): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const errorObj = err as Record<string, unknown>;
      const isTransient =
        errorObj?.status === 503 ||
        errorObj?.status === "UNAVAILABLE" ||
        errorObj?.code === 503 ||
        errorObj?.status === 429 ||
        String(errorObj?.message || "").includes("503") ||
        String(errorObj?.message || "").includes("high demand") ||
        String(errorObj?.message || "").includes("UNAVAILABLE") ||
        String(errorObj?.message || "").includes("RESOURCE_EXHAUSTED");

      if (attempt < maxRetries && isTransient) {
        const waitTime = delayMs * Math.pow(1.8, attempt);
        console.warn(`[Gemini API] Transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(waitTime)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        break;
      }
    }
  }
  throw lastErr;
}

// Helper to extract and verify Firebase Auth ID Token from request
async function getAuthUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return null;
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    firestoreEnabled: !!getFirestoreDb(),
  });
});

// Get Projects for Current Authenticated User
app.get("/api/user/projects", async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthUser(req);
    const userId = authUser?.uid || (req.query.userId as string | undefined);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: Sign in required to view your dubs" });
      return;
    }

    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db
        .collection("projects")
        .where("authorId", "==", userId)
        .get();

      const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ items });
      return;
    }
    res.json({ items: [] });
  } catch (err: unknown) {
    console.error("Fetch user projects error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to fetch user projects" });
  }
});

// Save Project to Firestore
app.post("/api/projects", async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthUser(req);
    const projectData = req.body as ProjectDataModel;
    const shareId = projectData.shareId || `dub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const payload: ProjectDataModel = {
      ...projectData,
      shareId,
      authorId: authUser?.uid || projectData.authorId || null,
      authorName: authUser?.name || projectData.authorName || (authUser ? "Director" : "Guest"),
      authorEmail: authUser?.email || null,
      createdAt: projectData.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    const db = getFirestoreDb();
    if (db) {
      await db.collection("projects").doc(shareId).set(payload);
    }
    res.json({ success: true, shareId });
  } catch (err: unknown) {
    console.error("Save project error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to save project" });
  }
});

// Update Existing Project
app.put("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthUser(req);
    const shareId = req.params.id;
    const updates = req.body as Partial<ProjectDataModel>;
    const db = getFirestoreDb();

    if (db) {
      const docRef = db.collection("projects").doc(shareId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const current = docSnap.data() as ProjectDataModel | undefined;
        if (authUser && current?.authorId && current.authorId !== authUser.uid) {
          res.status(403).json({ error: "Forbidden: You do not have permission to edit this dub" });
          return;
        }
        await docRef.update({
          ...updates,
          updatedAt: Date.now(),
        });
        res.json({ success: true });
        return;
      }
    }
    res.status(404).json({ error: "Project not found" });
  } catch (err: unknown) {
    console.error("Update project error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to update project" });
  }
});

// Delete Project
app.delete("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const authUser = await getAuthUser(req);
    const shareId = req.params.id;
    const db = getFirestoreDb();

    if (db) {
      const docRef = db.collection("projects").doc(shareId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const current = docSnap.data() as ProjectDataModel | undefined;
        if (authUser && current?.authorId && current.authorId !== authUser.uid) {
          res.status(403).json({ error: "Forbidden: You can only delete your own dub projects" });
          return;
        }
        await docRef.delete();
        res.json({ success: true });
        return;
      }
    }
    res.status(404).json({ error: "Project not found" });
  } catch (err: unknown) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to delete project" });
  }
});

// Upload Video & Vocal Takes Media to Cloud Storage
app.post("/api/projects/:id/media", async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { videoBase64, videoType, takes } = req.body as {
      videoBase64?: string;
      videoType?: string;
      takes?: Array<{
        id: string;
        playerId: string;
        characterId: string;
        audioBase64?: string;
        audioUrl?: string;
        duration: number;
        startTimeOffset: number;
        volume?: number;
        muted?: boolean;
        solo?: boolean;
        effect?: string;
        waveformData?: number[];
        vadSegments?: { start: number; end: number }[];
        recordedAt?: number;
      }>;
    };

    const bucket = getMediaBucket();
    if (!bucket) {
      res.status(500).json({ error: "Media storage bucket not configured" });
      return;
    }

    let videoUrl: string | null = null;
    if (videoBase64) {
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const ext = (videoType && videoType.includes("mp4")) ? "mp4" : "webm";
      const fileRef = bucket.file(`projects/${projectId}/video.${ext}`);
      await fileRef.save(videoBuffer, {
        contentType: videoType || "video/webm",
        metadata: { cacheControl: "public, max-age=31536000" },
      });
      videoUrl = `https://storage.googleapis.com/${MEDIA_BUCKET_NAME}/projects/${projectId}/video.${ext}`;
    }

    const uploadedTakes: Array<any> = [];
    if (Array.isArray(takes)) {
      for (const take of takes) {
        if (take.audioBase64) {
          const audioBuffer = Buffer.from(take.audioBase64, "base64");
          const audioFileRef = bucket.file(`projects/${projectId}/takes/${take.id}.wav`);
          await audioFileRef.save(audioBuffer, {
            contentType: "audio/wav",
            metadata: { cacheControl: "public, max-age=31536000" },
          });
          uploadedTakes.push({
            id: take.id,
            playerId: take.playerId,
            characterId: take.characterId,
            audioUrl: `https://storage.googleapis.com/${MEDIA_BUCKET_NAME}/projects/${projectId}/takes/${take.id}.wav`,
            duration: take.duration,
            startTimeOffset: take.startTimeOffset,
            volume: take.volume ?? 1.0,
            muted: Boolean(take.muted),
            solo: Boolean(take.solo),
            effect: take.effect || "none",
            waveformData: take.waveformData,
            vadSegments: take.vadSegments,
            recordedAt: take.recordedAt || Date.now(),
          });
        } else if (take.audioUrl) {
          uploadedTakes.push(take);
        }
      }
    }

    // Merge media URLs into Firestore Project document
    const db = getFirestoreDb();
    if (db) {
      const docRef = db.collection("projects").doc(projectId);
      const updateData: Record<string, any> = { updatedAt: Date.now() };
      if (videoUrl) updateData.videoUrl = videoUrl;
      if (uploadedTakes.length > 0) updateData.takes = uploadedTakes;
      await docRef.set(updateData, { merge: true });
    }

    res.json({ success: true, videoUrl, takes: uploadedTakes });
  } catch (err: unknown) {
    console.error("Upload project media error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to upload project media" });
  }
});

// Load Project by ID from Firestore
app.get("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const shareId = req.params.id;
    const db = getFirestoreDb();
    if (db) {
      const docSnap = await db.collection("projects").doc(shareId).get();
      if (docSnap.exists) {
        res.json(docSnap.data());
        return;
      }
    }
    res.status(404).json({ error: "Project not found" });
  } catch (err: unknown) {
    console.error("Load project error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to load project" });
  }
});

// Publish Dubbing Performance & Score to Community Hall of Fame
app.post("/api/community-dubs", async (req: Request, res: Response) => {
  try {
    const dubData = req.body as CommunityDubModel;
    const dubId = `hall-${Date.now().toString(36)}`;
    const payload: CommunityDubModel = {
      ...dubData,
      id: dubId,
      createdAt: Date.now(),
    };

    const db = getFirestoreDb();
    if (db) {
      await db.collection("community_dubs").doc(dubId).set(payload);
    }
    res.json({ success: true, dubId });
  } catch (err: unknown) {
    console.error("Publish community dub error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to publish dub" });
  }
});

// Get Recent Community Hall of Fame Dubs
app.get("/api/community-dubs", async (req: Request, res: Response) => {
  try {
    const limitCount = Math.min(20, parseInt(req.query.limit as string) || 6);
    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db
        .collection("community_dubs")
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ items });
      return;
    }
    res.json({ items: [] });
  } catch (err: unknown) {
    console.error("Fetch community dubs error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to fetch community dubs" });
  }
});

// AI Script Generation
app.post("/api/gemini/generate-script", async (req: Request, res: Response) => {
  try {
    const { genre, characters, duration = 20, promptHint } = req.body as {
      genre?: string;
      characters?: CharacterModel[];
      duration?: number;
      promptHint?: string;
    };
    const ai = await getGeminiClient();

    if (!ai) {
      res.json({
        scriptTitle: `${genre || "Epic"} Dubbing Session`,
        synopsis: "A comedic dubbing encounter.",
        characters: characters || [],
        lines: [],
      });
      return;
    }

    const { Type } = await getGeminiSdk();

    const prompt = `You are an expert Hollywood comedy director and dubbing scriptwriter.
Generate an energetic dubbing script for a scene lasting exactly ${duration} seconds.
Genre/Tone: "${genre || "Comedic Movie Scene"}".
Additional Direction: "${promptHint || "Make it dynamic with punchy lines"}".
Characters: ${JSON.stringify(characters || [])}

Create realistic line durations and acting cues.`;

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scriptTitle: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    speakerId: { type: Type.STRING },
                    speakerName: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    cue: { type: Type.STRING },
                  },
                  required: ["id", "speakerId", "speakerName", "startTime", "endTime", "text", "cue"],
                },
              },
            },
            required: ["scriptTitle", "synopsis", "lines"],
          },
        },
      });
    });

    const parsed: unknown = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: unknown) {
    console.error("Generate script error:", err);
    res.status(500).json({ error: getErrorMessage(err) || "Failed to generate script" });
  }
});

// AI Character Suggestions
app.post("/api/gemini/suggest-characters", async (req: Request, res: Response) => {
  try {
    const { sceneTitle, genre } = req.body as { sceneTitle?: string; genre?: string };
    const ai = await getGeminiClient();

    if (!ai) {
      res.json({
        characters: [
          { id: "char-1", name: "Protagonist", color: "#f43f5e", voiceStyle: "Heroic", avatarIcon: "🎬" },
          { id: "char-2", name: "Antagonist", color: "#0ea5e9", voiceStyle: "Sneaky", avatarIcon: "🎭" },
        ],
      });
      return;
    }

    const { Type } = await getGeminiSdk();

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Generate 2-3 colorful characters for scene "${sceneTitle || "Mystery"} (${genre || "Comedy"})".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    voiceStyle: { type: Type.STRING },
                    color: { type: Type.STRING },
                    avatarIcon: { type: Type.STRING },
                  },
                  required: ["id", "name", "voiceStyle", "color", "avatarIcon"],
                },
              },
            },
            required: ["characters"],
          },
        },
      });
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err: unknown) {
    res.status(500).json({ error: getErrorMessage(err) || "Failed to suggest characters" });
  }
});

// AI Judge Scoring
app.post("/api/gemini/ai-judge", async (req: Request, res: Response) => {
  try {
    const { scriptTitle, players, takesSummary, judgePersona } = req.body as {
      scriptTitle?: string;
      players?: Array<{ id: string; name: string }>;
      takesSummary?: unknown;
      judgePersona?: string;
    };
    const ai = await getGeminiClient();

    if (!ai) {
      res.json({
        judgeName: "Comedy Critic AI",
        personaStyle: judgePersona || "Sarcastic Critic",
        overallScore: 92,
        overallGrade: "A",
        directorCommentary: "Energetic delivery and great comic timing!",
        badgeAwarded: "🏆 Golden Mic",
        playerScores: (players || []).map((p) => ({
          playerId: p.id,
          playerName: p.name,
          score: 90,
          strengths: "Great comedic energy",
          areasForImprovement: "Try more voice modulation",
          funnyFeedback: "Oscars worthy performance!",
        })),
      });
      return;
    }

    const { Type } = await getGeminiSdk();

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Evaluate dubbing performance for "${scriptTitle}" as judge "${judgePersona}". Takes: ${JSON.stringify(takesSummary)}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              judgeName: { type: Type.STRING },
              personaStyle: { type: Type.STRING },
              overallScore: { type: Type.NUMBER },
              overallGrade: { type: Type.STRING },
              directorCommentary: { type: Type.STRING },
              badgeAwarded: { type: Type.STRING },
              playerScores: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    playerId: { type: Type.STRING },
                    playerName: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    strengths: { type: Type.STRING },
                    areasForImprovement: { type: Type.STRING },
                    funnyFeedback: { type: Type.STRING },
                  },
                  required: ["playerId", "playerName", "score", "strengths", "areasForImprovement", "funnyFeedback"],
                },
              },
            },
            required: ["judgeName", "personaStyle", "overallScore", "overallGrade", "directorCommentary", "badgeAwarded", "playerScores"],
          },
        },
      });
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err: unknown) {
    res.status(500).json({ error: getErrorMessage(err) || "Failed to judge performance" });
  }
});

// Transcribe & Diarize Endpoint
app.post("/api/gemini/transcribe-and-diarize", async (req: Request, res: Response) => {
  try {
    const { base64Audio, mimeType = "audio/wav", duration = 20, clipTitle = "Clip", vadHints = [] } = req.body as {
      base64Audio?: string;
      mimeType?: string;
      duration?: number;
      clipTitle?: string;
      vadHints?: Array<{ start: number; end: number }>;
    };
    const ai = await getGeminiClient();

    if (!ai || !base64Audio) {
      res.json({
        scriptTitle: `${clipTitle} Dialogue`,
        synopsis: "Transcribed lines ready for dubbing.",
        characters: [
          { id: "char-1", name: "Speaker 1", color: "#f43f5e", voiceStyle: "Expressive", avatarIcon: "🎬" },
          { id: "char-2", name: "Speaker 2", color: "#0ea5e9", voiceStyle: "Lively", avatarIcon: "🎭" },
        ],
        lines: [
          { id: "line-1", speakerId: "char-1", speakerName: "Speaker 1", startTime: 1.0, endTime: 4.5, text: "Hey! Did you hear that sound?", cue: "Curious" },
          { id: "line-2", speakerId: "char-2", speakerName: "Speaker 2", startTime: 5.0, endTime: 9.0, text: "Yeah, it sounds like an adventure starting!", cue: "Excited" },
        ],
      });
      return;
    }

    const { Type } = await getGeminiSdk();

    const prompt = `You are an expert audio transcriptionist and dialogue diarizer.
Audio duration: ${duration}s.
Voice activity intervals: ${JSON.stringify(vadHints.slice(0, 15))}.

Transcribe dialogue, detect distinct characters, and assign accurate timestamps within 0 to ${duration}s.`;

    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scriptTitle: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    voiceStyle: { type: Type.STRING },
                    color: { type: Type.STRING },
                    avatarIcon: { type: Type.STRING },
                  },
                  required: ["id", "name", "voiceStyle", "color", "avatarIcon"],
                },
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    speakerId: { type: Type.STRING },
                    speakerName: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    cue: { type: Type.STRING },
                  },
                  required: ["id", "speakerId", "speakerName", "startTime", "endTime", "text", "cue"],
                },
              },
            },
            required: ["scriptTitle", "synopsis", "characters", "lines"],
          },
        },
      });
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err: unknown) {
    res.status(500).json({ error: getErrorMessage(err) || "Failed to transcribe audio" });
  }
});

// Export Cloud Function
export const api = onRequest(
  {
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 120,
    secrets: ["GEMINI_API_KEY"],
  },
  app
);
