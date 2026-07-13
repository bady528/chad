import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "10mb" }));

// Lazy load Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for Text-to-Speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore", speed = "normal", customInstruction = "" } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text field is required and must be a string." });
      return;
    }

    const ai = getAiClient();

    // Map the requested reading pace to system instructions
    let paceInstruction = "";
    if (speed === "slow") {
      paceInstruction = "Speak at a slightly slower, deliberate pace, making it very easy to follow.";
    } else if (speed === "fast") {
      paceInstruction = "Speak at a slightly faster, energetic pace, keeping it lively.";
    } else {
      paceInstruction = "Speak at a natural, standard conversational speed.";
    }

    // Combine into a pristine system instruction for Tagalog voice synthesis
    const systemInstruction = 
      "You are an expert native Filipino (Tagalog) voiceover artist and narrator. " +
      "Your voice is extremely crisp, clean, accurate, and professional. " +
      "Read the provided text precisely using a natural Tagalog (Filipino) accent and correct pronunciation. " +
      "Do not read any formatting, metadata, or instructions. " +
      `${paceInstruction} ${customInstruction ? `Style note: ${customInstruction}.` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        systemInstruction,
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      res.status(500).json({ 
        error: "Failed to generate voice. The model did not return any audio data. Please try again." 
      });
      return;
    }

    res.json({ 
      audio: base64Audio,
      sampleRate: 24000,
      textLength: text.length
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(500).json({ 
      error: error.message || "An unexpected error occurred during audio generation." 
    });
  }
});

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
