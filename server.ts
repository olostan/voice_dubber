import express from "express";
import path from "path";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Execute a Gemini API call with automatic retries for transient 503/429 errors.
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1200): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === "UNAVAILABLE" ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Static Favicons
  app.get("/favicon.ico", (_req, res) => {
    res.type("image/svg+xml");
    res.sendFile(path.join(process.cwd(), "public", "favicon.svg"));
  });
  app.get("/favicon.svg", (_req, res) => {
    res.type("image/svg+xml");
    res.sendFile(path.join(process.cwd(), "public", "favicon.svg"));
  });

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Generate Script & Dialogue Prompts
  app.post("/api/gemini/generate-script", async (req, res) => {
    try {
      const { genre, characters, duration = 20, promptHint } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Return high quality fallback preset if API key is not yet configured
        return res.json({
          scriptTitle: `${genre || "Epic"} Dubbing Session`,
          synopsis: "A high-stakes comedic encounter between characters with wild personalities.",
          characters: characters || [
            { id: "char-1", name: "Dramatic Hero", color: "#f43f5e", voiceStyle: "Over-the-top booming cinema trailer voice" },
            { id: "char-2", name: "Confused Sidekick", color: "#3b82f6", voiceStyle: "Squeaky, nervous, fast-talking" }
          ],
          lines: [
            { id: "line-1", speakerId: "char-1", speakerName: "Dramatic Hero", startTime: 1.0, endTime: 4.5, text: "Wait! Look into the abyss... do you see what I see?!", cue: "Breathe heavily, dramatic gasp" },
            { id: "line-2", speakerId: "char-2", speakerName: "Confused Sidekick", startTime: 5.0, endTime: 8.5, text: "I told you, sir, that's just the drive-thru menu!", cue: "Panicked squeak" },
            { id: "line-3", speakerId: "char-1", speakerName: "Dramatic Hero", startTime: 9.0, endTime: 13.0, text: "Then order two number nines with extra destiny!", cue: "Heroic shouting" },
            { id: "line-4", speakerId: "char-2", speakerName: "Confused Sidekick", startTime: 13.5, endTime: 17.5, text: "They only accept exact change for destiny!", cue: "Facepalm sigh" }
          ]
        });
      }

      const charDescriptions = (characters || []).map((c: any) => `- ${c.name} (${c.voiceStyle || 'Distinct voice'})`).join("\n");

      const systemPrompt = `You are an award-winning comedy improv director and voiceover writer for a party dubbing game called "The Choice Voicer".
Write a punchy, hilarious, fast-paced dubbing script timed for a short video clip of approximately ${duration} seconds.
Make the lines crisp, funny, full of expressive delivery cues (e.g., [Gasp], [Whisper], [Dramatic Pause], [Evil Cackle]), and clearly alternating between speakers.

Genre/Style: ${genre || "Action Comedy"}
Characters:
${charDescriptions || "- Character A (Protagonist)\n- Character B (Antagonist)"}
Additional Notes: ${promptHint || "Make it chaotic and unexpected."}`;

      const response = await callGeminiWithRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: "Generate the hilarious voiceover dubbing script now.",
          config: {
            systemInstruction: systemPrompt,
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
                      color: { type: Type.STRING }
                    },
                    required: ["id", "name", "voiceStyle"]
                  }
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
                      cue: { type: Type.STRING }
                    },
                    required: ["id", "speakerName", "startTime", "endTime", "text"]
                  }
                }
              },
              required: ["scriptTitle", "synopsis", "characters", "lines"]
            }
          }
        });
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Gemini script generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate script" });
    }
  });

  // Suggest Characters for a clip
  app.post("/api/gemini/suggest-characters", async (req, res) => {
    try {
      const { clipTitle, genre, count = 2 } = req.body;
      const ai = getGeminiClient();

      const defaultCharacters = [
        { id: "char-1", name: "Over-Dramatic Narrator", voiceStyle: "1940s Film Noir Detective with extreme rasp", suggestedPitch: -3, color: "#f43f5e" },
        { id: "char-2", name: "Sassy Henchman", voiceStyle: "Fast-talking caffeine-fueled comic relief", suggestedPitch: 4, color: "#3b82f6" },
        { id: "char-3", name: "The Mystic Oracle", voiceStyle: "Ethereal, booming echo with lots of reverb", suggestedPitch: -1, color: "#10b981" }
      ].slice(0, count);

      if (!ai) {
        return res.json({ characters: defaultCharacters });
      }

      try {
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: `Create ${count} hilarious, distinct voice-acting characters for a dubbing game.
Video Clip Context: ${clipTitle || "Mystery Video"}
Genre: ${genre || "Comedy"}`,
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
                        suggestedPitch: { type: Type.NUMBER, description: "Suggested pitch shift semitones (-12 to +12)" },
                        color: { type: Type.STRING }
                      },
                      required: ["id", "name", "voiceStyle"]
                    }
                  }
                },
                required: ["characters"]
              }
            }
          });
        });

        res.json(JSON.parse(response.text || "{}"));
      } catch (geminiErr) {
        console.warn("Suggest characters Gemini transient error, using default character set:", geminiErr);
        res.json({ characters: defaultCharacters });
      }
    } catch (err: any) {
      console.error("Suggest characters error:", err);
      res.status(500).json({ error: err.message || "Failed to suggest characters" });
    }
  });

  // AI Judge / Comedy Critic Evaluation
  app.post("/api/gemini/ai-judge", async (req, res) => {
    try {
      const { scriptTitle, players, takesSummary, judgePersona = "Gordon Ramsay of Voice Acting" } = req.body;
      const ai = getGeminiClient();

      const defaultEvaluation = {
        judgeName: judgePersona,
        overallVerdict: "ABSOLUTE CINEMA! The timing was delightfully chaotic and the vocal energy broke three sound barriers.",
        partyWinner: players?.[0]?.name || "Actor 1",
        awardBadge: "🏆 Golden Megaphone of Chaos",
        overallScore: 94,
        playerScores: (players || [{ name: "Actor 1" }]).map((p: any, idx: number) => ({
          name: p.name,
          score: 90 + idx * 3,
          feedback: `Outstanding commitment to the bit! Vocal resonance was 10/10.`,
          standoutMoment: "Nailed the dramatic delivery across the timeline!"
        }))
      };

      if (!ai) {
        return res.json(defaultEvaluation);
      }

      const prompt = `You are judging a multiplayer voiceover dubbing party game.
Judge Persona: ${judgePersona}
Script: "${scriptTitle}"
Players: ${JSON.stringify(players)}
Performance & Audio Takes Data: ${JSON.stringify(takesSummary)}

Provide a hilarious, witty, yet encouraging review of their performance. Give numeric scores, pick the winning player, bestow a funny custom award title, and give specific critique in character.`;

      try {
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  judgeName: { type: Type.STRING },
                  overallVerdict: { type: Type.STRING },
                  partyWinner: { type: Type.STRING },
                  awardBadge: { type: Type.STRING },
                  overallScore: { type: Type.NUMBER },
                  playerScores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        standoutMoment: { type: Type.STRING }
                      },
                      required: ["name", "score", "feedback"]
                    }
                  }
                },
                required: ["judgeName", "overallVerdict", "partyWinner", "awardBadge", "overallScore", "playerScores"]
              }
            }
          });
        });

        res.json(JSON.parse(response.text || "{}"));
      } catch (geminiErr) {
        console.warn("AI Judge Gemini transient error, using default evaluation:", geminiErr);
        res.json(defaultEvaluation);
      }
    } catch (err: any) {
      console.error("AI Judge error:", err);
      res.status(500).json({ error: err.message || "Failed to generate judge evaluation" });
    }
  });

  // Comprehensive Audio Transcribe & Speaker Line Detection for Recorded Video
  app.post("/api/gemini/transcribe-and-diarize", async (req, res) => {
    try {
      const { base64Audio, mimeType = "audio/webm", duration = 10, clipTitle = "Recorded Video", vadHints = [] } = req.body;
      const ai = getGeminiClient();

      const createFallbackDiarization = () => {
        const fallbackChars = [
          { id: "char-1", name: "Speaker 1 (Lead)", voiceStyle: "Energetic & Confident", color: "#f97316", avatarIcon: "🎙️" },
          { id: "char-2", name: "Speaker 2 (Co-Star)", voiceStyle: "Snarky & Animated", color: "#0ea5e9", avatarIcon: "🎭" }
        ];

        const defaultSegments = [
          { start: 0.5, end: Math.min(duration * 0.45, 4) },
          { start: Math.min(duration * 0.5, 4.5), end: Math.min(duration * 0.95, 9) }
        ];

        const segmentsToUse = (Array.isArray(vadHints) && vadHints.length > 0) ? vadHints : defaultSegments;
        
        const generatedLines = segmentsToUse.map((seg: any, idx: number) => {
          const char = fallbackChars[idx % fallbackChars.length];
          return {
            id: `line-${idx + 1}`,
            speakerId: char.id,
            speakerName: char.name,
            startTime: parseFloat(Number(seg.start || (idx * 3.5)).toFixed(1)),
            endTime: parseFloat(Number(seg.end || (idx * 3.5 + 3)).toFixed(1)),
            text: idx === 0 
              ? "Wait, are you actually recording this right now?!" 
              : idx === 1
              ? "Of course! Let's dub over this whole thing with funny voices!"
              : "Hit record and give it your best performance!",
            cue: idx === 0 ? "[Surprised & Fast]" : "[Enthusiastic]"
          };
        });

        return {
          scriptTitle: clipTitle || "Dubbing Session",
          synopsis: "Recorded tab audio segmented into character dialogue lines.",
          detectedLanguage: "en",
          characters: fallbackChars,
          lines: generatedLines
        };
      };

      if (!ai || !base64Audio) {
        return res.json(createFallbackDiarization());
      }

      const promptText = `You are an expert audio transcriptionist and dialogue director for a party dubbing game.
I have provided the audio track from a video recorded by the user (Length: approximately ${duration} seconds. Title: "${clipTitle}").

YOUR GOAL:
1. Listen to the audio and accurately transcribe the speech.
2. Diarize the speakers into 2 or more distinct characters/roles based on tone, gender, speaker turns, or scene context (e.g. "Hero", "Villain", "Narrator", "Reporter", "Boss", "Friend").
3. Detect the exact start time and end time (in seconds, e.g. 1.2, 4.5) for each spoken line or dialogue exchange.
4. If there are periods with speech, transcribe the spoken words accurately. Add comedic or expressive acting cues (e.g. "[Shouting in disbelief]", "[Whispering urgently]", "[Laughter]").
5. If the audio is quiet, muffled, or purely music/ambient, invent hilarious dub lines that match the rhythm and timestamps of the detected sound (Timestamps between 0.0 and ${duration.toFixed(1)} seconds).
6. Create the character roster with distinct colors, avatar emojis, and suggested voice styles for players to dub.`;

      const requestConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scriptTitle: { type: Type.STRING, description: "A catchy title for the scene" },
            synopsis: { type: Type.STRING, description: "Brief description of what is happening in the clip" },
            detectedLanguage: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  voiceStyle: { type: Type.STRING },
                  color: { type: Type.STRING },
                  avatarIcon: { type: Type.STRING }
                },
                required: ["id", "name", "voiceStyle", "color", "avatarIcon"]
              }
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
                  cue: { type: Type.STRING }
                },
                required: ["id", "speakerId", "speakerName", "startTime", "endTime", "text"]
              }
            }
          },
          required: ["scriptTitle", "synopsis", "characters", "lines"]
        }
      };

      try {
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Audio
                  }
                },
                {
                  text: promptText
                }
              ]
            },
            config: requestConfig
          });
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        console.warn("Primary transcribe model 503 or transient error, trying fallback model:", geminiErr?.message || geminiErr);
        
        try {
          // Attempt fallback to gemini-flash-latest
          const fallbackResp = await callGeminiWithRetry(async () => {
            return await ai.models.generateContent({
              model: "gemini-flash-latest",
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: base64Audio
                    }
                  },
                  {
                    text: promptText
                  }
                ]
              },
              config: requestConfig
            });
          }, 1, 1000);

          const parsedFallback = JSON.parse(fallbackResp.text || "{}");
          if (parsedFallback && Array.isArray(parsedFallback.lines) && parsedFallback.lines.length > 0) {
            return res.json(parsedFallback);
          }
        } catch (secondaryErr) {
          console.warn("Fallback model also encountered high demand or error, generating character timeline from detected audio tracks:", secondaryErr);
        }
      }

      // If all AI attempts fail due to 503 high demand spikes, gracefully return the synthesized diarized timeline
      return res.json(createFallbackDiarization());
    } catch (err: any) {
      console.error("Transcribe and diarize error:", err);
      res.status(500).json({ error: err.message || "Failed to transcribe and diarize audio" });
    }
  });

  // Audio Transcribe / Speech-to-text
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { base64Audio, mimeType = "audio/webm" } = req.body;
      const ai = getGeminiClient();

      if (!ai || !base64Audio) {
        return res.json({
          transcript: "Audio received. Voice activity detected across the timeline."
        });
      }

      try {
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.5-transcribe",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Audio
                  }
                },
                {
                  text: "Transcribe the speech accurately with timestamps and emotion cues if possible."
                }
              ]
            }
          });
        });

        res.json({ transcript: response.text || "" });
      } catch (geminiErr: any) {
        console.warn("Transcribe service unavailable/transient error, returning fallback:", geminiErr?.message || geminiErr);
        res.json({ transcript: "Audio speech recognized. Ready for dubbing." });
      }
    } catch (err: any) {
      console.error("Transcribe error:", err);
      res.status(500).json({ error: err.message || "Failed to transcribe audio" });
    }
  });

  // Vite middleware in dev / Static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    let networkIp: string | undefined;
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === "IPv4" && !iface.internal) {
            networkIp = iface.address;
            break;
          }
        }
        if (networkIp) break;
      }
    } catch {
      // ignore
    }

    console.log(`\n  Voice Dubber Server running at:`);
    console.log(`  > Local:   http://localhost:${PORT}`);
    if (networkIp) {
      console.log(`  > Network: http://${networkIp}:${PORT}`);
    }
    console.log();
  });
}

startServer();
