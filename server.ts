import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { UrgencyLevel } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser
  app.use(express.json());

  // Safe Lazy initialization of Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "AIzaSyCywAy7vzOaGz7wmW-wCL9SbMb_2RzQAMs") {
      throw new Error("API key expired. Please renew the API key.");
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API - Secure Triage assessment endpoint
  app.post("/api/triage", async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Missing required 'data' field." });
      }

      const ai = getAi();
      const SYSTEM_PROMPT = `
You are a highly experienced triage nurse assistant. Your goal is to analyze patient symptoms and categorize them into one of four clinical urgency levels.

IMPORTANT RULES:
1. DO NOT provide a medical diagnosis.
2. DO NOT suggest specific medications.
3. ALWAYS prioritize safety. If in doubt between two levels, choose the more urgent one.
4. The output must be educational and guiding, not clinical.

URGENCY LEVELS:
- EMERGENCY: Immediate life-threatening symptoms (stroke signs, heart attack, severe trauma). Instruction: Call emergency services (108/104/102).
- URGENT: Non-life-threatening but needs same-day attention (high fever, moderate pain, suspected fracture). Instruction: Visit Urgent Care or Minor Injuries Unit today.
- ROUTINE: Non-urgent symptoms that should be seen by a GP within 24-72 hours (recurring mild pain, skin issues, chronic condition follow-up). Instruction: Book an appointment with your GP.
- SELF_CARE: Minor issues that can be managed at home (cold/flu, minor scratches, mild muscle pull). Instruction: Rest, hydrate, and monitor symptoms.

RESPONSE SCHEMA:
You must respond in JSON format with the following fields:
- level: One of "EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"
- title: A short, clear headline for the user.
- recommendation: A concise instruction on what to do next.
- rationale: A brief explanation of why this urgency level was chosen (max 2 sentences).
- nextSteps: A 3-item list of practical steps.
- possibleCauses: A 2-3 item list of potential conditions based on common patterns, with a clear note that they are not diagnoses.

Example possibleCauses: ["Typical Migraine pattern", "Tension Headache"]
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Perform a triage assessment for the following patient data:
        Age: ${data.age}
        Gender: ${data.gender}
        Symptoms: ${data.symptoms}
        Duration: ${data.duration}
        Severity (1-10): ${data.severity}
        Pre-existing conditions: ${data.preExisting}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, enum: Object.values(UrgencyLevel) },
              title: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              rationale: { type: Type.STRING },
              nextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              possibleCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["level", "title", "recommendation", "rationale", "nextSteps", "possibleCauses"]
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (err: any) {
      console.error("Server API Triage Error:", err);
      const errMsg = String(err?.message || err || "");
      if (errMsg.includes("expired") || errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key")) {
        return res.status(500).json({ error: "GEMINI_API_KEY_EXPIRED: The Gemini API key has expired or is invalid. Please renew/verify your API key in the AI Studio Settings menu." });
      }
      res.status(500).json({ error: errMsg || "Failed to process triage assessment." });
    }
  });

  // API - secure Chat Interview/Follow-up endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messageHistory, currentData } = req.body;
      if (!messageHistory || !currentData) {
        return res.status(400).json({ error: "Missing required 'messageHistory' or 'currentData' parameters." });
      }

      const ai = getAi();
      const CHAT_SYSTEM_PROMPT = `
You are a highly analytical clinical triage assistant conducting an adaptive intake interview. Your goal is to guide the patient through clear, conservative follow-up questions to understand their core symptom cluster fully.

IMPORTANT DIRECTIVES:
- Standard intake starts with general symptom description. Gather details: location, characteristics (radiating, pressure, burning), accompanying triggers, onset details.
- If symptoms match red-flags (e.g. chest pain, severe shortness of breath, sudden numbness3), keep questions highly conservative and direct.
- Formulate short, direct, simple, jargon-free questions (Max 2 sentences).
- Provide 3-4 specific quick-reply suggestions (e.g. ["Radiating to arm", "Dull pressure", "Stabbing pain", "No, none of these"]).
- Evaluate if you have enough information to proceed to full triage (typically after 3-4 exchanges or early if user signals completeness). Set "isComplete" to true when enough baseline facts are gathered.
- Provide "refinedSymptomsSummary" which accumulates all described symptoms, answers, age, pre-existing conditions so far into a clean clinical outline.

Output strictly in JSON format matching the schema.
`;

      const formattedHistory = messageHistory.map((m: any) => `${m.role === 'user' ? 'Patient' : 'Triage Assistant'}: ${m.text}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Patient demographics: Age: ${currentData.age || 'Unknown'}, Sex: ${currentData.gender || 'Unknown'}, Background: ${currentData.preExisting || 'None'}.
        
        Here is the interview dialogue so far:
        ${formattedHistory}
        
        Please ask the next clinical question or summarize if we have sufficient symptom data.`,
        config: {
          systemInstruction: CHAT_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              isComplete: { type: Type.BOOLEAN },
              refinedSymptomsSummary: { type: Type.STRING }
            },
            required: ["question", "suggestions", "isComplete", "refinedSymptomsSummary"]
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (err: any) {
      console.error("Server API Chat Error:", err);
      const errMsg = String(err?.message || err || "");
      if (errMsg.includes("expired") || errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key")) {
        return res.status(500).json({ error: "GEMINI_API_KEY_EXPIRED: The Gemini API key has expired or is invalid. Please renew/verify your API key in the AI Studio Settings menu." });
      }
      res.status(500).json({ error: errMsg || "Failed to process chat response." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite development middleware versus production assets static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
