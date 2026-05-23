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
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Missing required 'data' field." });
    }

    try {
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
      res.json({ ...result, isFallback: false });
    } catch (err: any) {
      console.warn("⚠️ [MediTriage API Key Fallback Triggered]: Handling clinical assessment locally due to expired/missing key.");
      
      const symptomsLower = (data.symptoms || "").toLowerCase();
      const severity = Number(data.severity) || 5;

      // Safe heuristic clinical fallback
      const matchesRedFlag = [
        'chest pain', 'difficulty breathing', 'shortness of breath', 'stroke', 
        'facial drooping', 'arm weakness', 'speech difficulty', 'severe bleeding',
        'allergic reaction', 'anaphylaxis', 'unconscious', 'suicidal', 'breathing'
      ].some(flag => symptomsLower.includes(flag)) || severity >= 8;

      const matchesUrgent = [
        'fever', 'fracture', 'broken', 'burn', 'vomiting', 'abdominal', 'severe head', 'dehydration'
      ].some(word => symptomsLower.includes(word)) || severity >= 5;

      let resolvedLevel = "SELF_CARE";
      let baseRecommendation = "Practice localized self-care measures at home and monitor your progress closely. Consult a pharmacist or GP if symptoms persist.";
      let baseRationale = "We have active backup triage analytics running. Your reports indicate steady recuperation and home monitoring.";

      if (matchesRedFlag) {
        resolvedLevel = "EMERGENCY";
        baseRecommendation = "Please call emergency services (e.g., 108/104/102) or go to the nearest Emergency Department immediately.";
        baseRationale = "Critical indicators identified. General medicine safety mandates rapid professional clinician oversight at an ER ward.";
      } else if (matchesUrgent) {
        resolvedLevel = "URGENT";
        baseRecommendation = "Please contact a same-day urgent care clinic, minor injuries unit, or GP urgent services for proper physical evaluation today.";
        baseRationale = "Moderate physical indices identified. Timely assessment is advised within 24 hours to clear underlying acute issues.";
      } else if (severity >= 3) {
        resolvedLevel = "ROUTINE";
        baseRecommendation = "Please book a routine appointment with your general practitioner or primary care clinic within the next 24-72 hours.";
        baseRationale = "Mild discomfort parameters suggest consulting your family clinic therapist or consultant GP in the next 1-3 days.";
      }

      let customTitle = "Offline Clinical Support";
      let customRemedies = [
        "Rest in a comfortable, quiet, well-ventilated space to support natural healing",
        "Ensure steady hydration with clean water, herbal teas, or oral electrolytes",
        "Monitor symptoms closely and log any changes in quality, localization, or severity"
      ];
      let customCauses = ["Mild physical fatigue or muscular stiffness", "Nonspecific minor systemic sensitivity"];

      if (symptomsLower.includes('chest') || symptomsLower.includes('breath') || symptomsLower.includes('heart') || symptomsLower.includes('tightness')) {
        customTitle = "Airway Soothing & Chest Rest Protocol";
        customRemedies = [
          "Sit completely upright in a supportive chair to maximize chest cavity expansion",
          "Perform calm, slow abdominal breathing through pursed lips to reduce respiratory stress",
          "Avoid any sudden movements, climbing stairs, or typing strenuous messages"
        ];
        customCauses = ["Chest wall muscle irritation", "Stress/anxiety associated pacing tension", "Bronchial sensitivity"];
      } else if (symptomsLower.includes('fever') || symptomsLower.includes('chill') || symptomsLower.includes('temperature') || symptomsLower.includes('shiver')) {
        customTitle = "Body Temperature Regulation Guidance";
        customRemedies = [
          "Apply a lukewarm, damp compress to your forehead, armpits, or neck to gently ease discomfort",
          "Sip cool water or oral rehydration salts (ORS) frequently in small quantities to prevent dehydration",
          "Rest completely in a well-ventilated space; avoid heavy blankets which conserve heat"
        ];
        customCauses = ["Transient post-viral response", "Acute systemic inflammatory response"];
      } else if (symptomsLower.includes('vomit') || symptomsLower.includes('nausea') || symptomsLower.includes('stomach') || symptomsLower.includes('belly') || symptomsLower.includes('abdomen') || symptomsLower.includes('diarrhea')) {
        customTitle = "Gastric Rest & Oral Fluid Rehydration";
        customRemedies = [
          "Take tiny, frequent sips of light oral electrolytes or clean water to restore balance",
          "Avoid solid foods, dairy products, or high-sugar items to allow gastric recovery",
          "Rest in a semi-upright seated position; do not lie flat immediately after swallowing fluids"
        ];
        customCauses = ["Acute gastrointestinal tract irritation", "Bacterial or viral foodborne reaction"];
      } else if (symptomsLower.includes('head') || symptomsLower.includes('migraine') || symptomsLower.includes('headache')) {
        customTitle = "Sensory Deprivation & Head Soothing";
        customRemedies = [
          "Retreat to a quiet, darkened, cool room to eliminate bright lights and noisy sensory triggers",
          "Apply a cold gel pack or cool compress across your forehead or temples",
          "Drink a large glass of water and practice very gentle neck rolls to ease tension"
        ];
        customCauses = ["Vascular tension headache", "Dehydration-induced cephalalgia"];
      }

      res.status(200).json({
        level: resolvedLevel,
        title: `${customTitle} (Local Sandbox Mode)`,
        recommendation: baseRecommendation,
        rationale: baseRationale + " (Powered by local triage heuristics. To restore automated Gemini analysis, please renew your GEMINI_API_KEY in Settings)",
        nextSteps: customRemedies,
        possibleCauses: customCauses,
        isFallback: true,
        apiKeyExpired: true
      });
    }
  });

  // API - secure Chat Interview/Follow-up endpoint
  app.post("/api/chat", async (req, res) => {
    const { messageHistory, currentData } = req.body;
    if (!messageHistory || !currentData) {
      return res.status(400).json({ error: "Missing required 'messageHistory' or 'currentData' parameters." });
    }

    try {
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
      console.warn("⚠️ [MediTriage API Key Fallback Triggered]: Handling chat adaptive interview locally due to expired/missing key.");
      
      const userMessages = (messageHistory || []).filter((m: any) => m.role === 'user');
      const userCount = userMessages.length;
      const fullDialogueToken = userMessages.map((m: any) => (m.text || "").toLowerCase()).join(" ");

      let question = "Could you tell me a bit more about how long this has been going on and if anything makes it worse?";
      let suggestions = ["It has been getting worse", "It remains stable", "It is constant", "Not sure"];
      let isComplete = false;

      if (userCount >= 3) {
        isComplete = true;
        question = "Thank you. I have gathered enough clinical correlation to finalize your triage profile. Please commit this medical case file to proceed.";
        suggestions = ["Finish Assessment"];
      } else {
        if (fullDialogueToken.includes('chest') || fullDialogueToken.includes('breath') || fullDialogueToken.includes('heart') || fullDialogueToken.includes('tightness')) {
          if (userCount === 1) {
            question = "To ensure utmost safety: Do you feel any radiating pressure or pain around your shoulders, throat, or left arm?";
            suggestions = ["No radiating pressure", "Yes, left arm tightness", "Yes, jaw discomfort", "Mild pins and needles"];
          } else if (userCount === 2) {
            question = "Are you experiencing any sweating, dizziness, or stomach distress alongside?";
            suggestions = ["No sweating or dizziness", "Yes, feel cold sweat", "Yes, feeling lightheaded", "Nauseous"];
          }
        } else if (fullDialogueToken.includes('cough') || fullDialogueToken.includes('cold') || fullDialogueToken.includes('throat') || fullDialogueToken.includes('fever') || fullDialogueToken.includes('flu')) {
          if (userCount === 1) {
            question = "Are you experiencing any physical chills or difficulty swallowing liquids?";
            suggestions = ["Yes, chills and shivers", "Difficulty swallowing", "No chills or difficulty", "Dry tickling cough"];
          } else if (userCount === 2) {
            question = "Do you have a productive cough (with yellow or green phlegm) or is it dry and tickly?";
            suggestions = ["Dry tickly cough", "Productive with clear mucus", "Productive with colored mucus", "Slight hoarseness"];
          }
        } else if (fullDialogueToken.includes('stomach') || fullDialogueToken.includes('belly') || fullDialogueToken.includes('abdomen') || fullDialogueToken.includes('cramp') || fullDialogueToken.includes('nausea') || fullDialogueToken.includes('vomit')) {
          if (userCount === 1) {
            question = "Is the stomach pain concentrated in one specific region (such as lower right stomach) or all over?";
            suggestions = ["Lower right stomach area", "Upper middle stomach", "Diffuse all over my belly", "No specific focus"];
          } else if (userCount === 2) {
            question = "Are you able to keep any fluids or mild broths down without nauseous feedback?";
            suggestions = ["Can keep water/fluids down", "Unable to keep water down", "Have not tried to drink", "Severe abdominal cramps"];
          }
        }
      }

      const formattedSummary = `Patient Context (Local Fallback Analysis):\n` +
        `- Age/Sex: ${currentData.age || 'Unknown'}/${currentData.gender || 'Unknown'}\n` +
        `- Pre-existing: ${currentData.preExisting || 'None'}\n` +
        `- Patient Logs:\n  ` + 
        userMessages.map((m: any, i: number) => `Q${i+1}: ${m.text}`).join('\n  ');

      res.status(200).json({
        question,
        suggestions,
        isComplete,
        refinedSymptomsSummary: formattedSummary,
        isFallback: true,
        apiKeyExpired: true
      });
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
