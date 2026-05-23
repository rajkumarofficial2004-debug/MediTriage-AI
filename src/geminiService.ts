import { AssessmentData, UrgencyLevel, TriageResult, AdaptiveQuestionResult } from "./types";

export async function getTriageAssessment(data: AssessmentData): Promise<TriageResult> {
  try {
    const res = await fetch('/api/triage', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      let serverError = `HTTP error! status: ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.error) {
          serverError = errJson.error;
        }
      } catch (_) {}
      throw new Error(serverError);
    }

    const result = await res.json();
    return { ...(result as TriageResult), isFallback: result.isFallback || false };
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    if (errorMsg.includes("expired") || errorMsg.includes("API key") || errorMsg.includes("API_KEY")) {
      console.warn("⚠️ [Triage AI Client Key Warning]: Operating under clinical safety backups:", errorMsg);
    } else {
      console.error("Triage AI Error:", error);
    }
    
    // Smart heuristic analyzer for patient safety, home remedies, and precautions
    const symptomsLower = (data.symptoms || "").toLowerCase();
    
    // Check if symptoms match any of the standard high-risk indicators (red flags)
    const matchesRedFlag = [
      'chest pain', 'difficulty breathing', 'shortness of breath', 'stroke', 
      'facial drooping', 'arm weakness', 'speech difficulty', 'severe bleeding',
      'allergic reaction', 'anaphylaxis', 'unconscious', 'suicidal', 'breathing'
    ].some(flag => symptomsLower.includes(flag)) || data.severity >= 8;

    // Check if symptoms match any moderately urgent indicators
    const matchesUrgent = [
      'fever', 'fracture', 'broken', 'burn', 'vomiting', 'abdominal', 'severe head', 'dehydration'
    ].some(word => symptomsLower.includes(word)) || data.severity >= 5;

    // 1. Determine safe urgency level & primary base recommendations
    let resolvedLevel = UrgencyLevel.SELF_CARE;
    let baseRecommendation = "Practice localized self-care measures at home and monitor your progress closely. Consult a pharmacist or GP if symptoms persist.";
    let baseRationale = "We encountered a temporary connection issue. Your symptoms appear manageable with standard home remedies and active symptom tracking.";

    if (matchesRedFlag) {
      resolvedLevel = UrgencyLevel.EMERGENCY;
      baseRecommendation = "Please call emergency services (e.g., 108/104/102) or go to the nearest Emergency Department immediately.";
      baseRationale = "You have reported potentially high-risk or severe symptoms. Standard safety protocols advise immediate, direct clinical evaluation.";
    } else if (matchesUrgent) {
      resolvedLevel = UrgencyLevel.URGENT;
      baseRecommendation = "Please contact a same-day urgent care clinic, minor injuries unit, or GP urgent services for proper physical evaluation today.";
      baseRationale = "Your reported moderate-to-high severity symptoms warrant swift professional attention today for proper evaluation.";
    } else if (data.severity >= 3) {
      resolvedLevel = UrgencyLevel.ROUTINE;
      baseRecommendation = "Please book a routine appointment with your general practitioner or primary care clinic within the next 24-72 hours.";
      baseRationale = "Your reported mild-to-moderate symptoms warrant a standard medical check-up to ensure proper monitoring.";
    }

    // 2. Initialize default symptom remedies and possible causes
    let customTitle = "General Supportive Care & Relief Advice";
    let customRemedies = [
      "Rest in a comfortable, quiet, well-ventilated space to support natural healing",
      "Ensure steady hydration with clean water, herbal teas, or oral rehydration fluids",
      "Monitor symptoms closely and log any changes in quality, localization, or severity"
    ];
    let customCauses = ["Mild physical fatigue or transient muscle strain", "Generic minor systemic sensitivity"];
    let painReliefTip = "Prioritize total rest and continuous slow hydration to ease systemic discomfort.";

    // 3. Match clinical symptom profiles to load specific comfort remedies and pain-relief tips
    if (symptomsLower.includes('chest') || symptomsLower.includes('breath') || symptomsLower.includes('shortness of breath') || symptomsLower.includes('tightness')) {
      customTitle = "Chest Comfort & Airway Soothing Protocol";
      painReliefTip = "To ease chest wall muscle strain or breathing work, sit completely upright (leaning forward slightly with hands on knees), loosen tight garments, and perform slow, controlled breaths through pursed lips.";
      customRemedies = [
        "Sit completely upright in a supportive chair to maximize chest cavity expansion",
        "Perform calm, slow abdominal breathing through pursed lips to reduce respiratory stress",
        "Avoid any sudden movements, climbing stairs, or speaking in long, strenuous sentences"
      ];
      customCauses = ["Chest wall musculoskeletal strain", "Anxiety-associated hyperventilation", "Mild symptomatic cardiorespiratory congestion"];
    } 
    else if (symptomsLower.includes('fever') || symptomsLower.includes('chill') || symptomsLower.includes('temperature') || symptomsLower.includes('shiver')) {
      customTitle = "Body Temperature Regulations & Relief Remedies";
      painReliefTip = "To soothe high fever and full-body chills, rest in a cool room, dress in lightweight/ breathable clothing, and place a damp lukewarm washcloth on your forehead or the back of your neck. Avoid ice baths.";
      customRemedies = [
        "Apply a lukewarm, damp compress to your forehead, armpits, or neck to gently ease body temperature",
        "Sip cool water or oral rehydration salts (ORS) frequently in small quantities to prevent dehydration",
        "Rest completely in a well-ventilated space; avoid heavy blankets which raise core body heat"
      ];
      customCauses = ["Viral respiratory process (such as Influenza or common cold)", "Acute infectious pyrexia or inflammatory response"];
    }
    else if (symptomsLower.includes('fracture') || symptomsLower.includes('broken') || symptomsLower.includes('bone') || symptomsLower.includes('joint') || symptomsLower.includes('sprain') || symptomsLower.includes('strain')) {
      customTitle = "Orthopedic Splinting & Local Cold Compresses";
      painReliefTip = "To soothe bone or joint discomfort, completely rest the affected limb. Apply a wrapped ice pack for 15 minutes at a time to numb pain, and elevate the limb above heart level to decrease swelling.";
      customRemedies = [
        "Do not apply weight, load, or physical pressure to the affected limb, bone, or joint",
        "Apply an ice pack wrapped in a thin cloth (never apply direct ice) for 15-20 minutes to reduce local throbbing",
        "Immobilize the joint using a soft sling or bandage, and elevate it above the level of your heart"
      ];
      customCauses = ["Potential bone fissure or fracture", "High-grade joint sprain or localized ligamentous stress"];
    }
    else if (symptomsLower.includes('vomit') || symptomsLower.includes('nausea') || symptomsLower.includes('dehydration')) {
      customTitle = "Gastric Rest & Oral Fluid Rehydration Guidelines";
      painReliefTip = "To settle a nauseous stomach or vomiting, avoid solid foods entirely for 2-4 hours. Sip small amounts of rehydration fluids (one tablespoon every 10-15 minutes) slowly so it remains down.";
      customRemedies = [
        "Take tiny, frequent sips of Oral Rehydration Salts (ORS) or clear broth to restore electrolytes",
        "Avoid solid foods, dairy products, or high-sugar items for a few hours to allow gastric recovery",
        "Rest in a semi-upright seated position; do not lie flat immediately after swallowing fluids"
      ];
      customCauses = ["Acute viral gastroenteritis", "Foodborne digestive irritation", "Systemic dehydration fatigue"];
    }
    else if (symptomsLower.includes('stomach') || symptomsLower.includes('belly') || symptomsLower.includes('cramp') || symptomsLower.includes('abdominal') || symptomsLower.includes('diarrhea')) {
      customTitle = "Abdominal Cramping & Gut Relaxation Measures";
      painReliefTip = "To calm abdominal colic or cramps, lie on your side with your knees drawn gently toward your chest to release muscle tension, and place a warm compress or heat pad over the tummy.";
      customRemedies = [
        "Place a warm compress or soft heating pad over your stomach for 15 minutes to reduce gut spasms",
        "Refrain from consuming heavy, greasy, spicy, acidic foods or dairy which irritate the digestive tract",
        "Adopt a bland nutrition routine (bananas, soft plain rice, applesauce, or plain toast)"
      ];
      customCauses = ["Functional abdominal colic or bowel spasm", "Dietary gut irritation or transient gastroenteritis"];
    }
    else if (symptomsLower.includes('head') || symptomsLower.includes('migraine') || symptomsLower.includes('headache')) {
      customTitle = "Sensory Deprivation & Vascular Head Soothing";
      painReliefTip = "To ease severe headache or migraine throbbing, lie down in a dark, completely silent room. Apply a cool washcloth or gel ice pack to your temples or forehead, and slowly drink basic water.";
      customRemedies = [
        "Retreat to a quiet, darkened, cool room to eliminate bright lights and noisy sensory triggers",
        "Apply a cold gel pack or cool compress across your forehead, temples, or base of the skull",
        "Drink a large glass of water and practice very gentle neck rolls to dissipate muscle tension"
      ];
      customCauses = ["Vascular tension headache", "Migraine episode flare-up", "Dehydration or sinus-pressure head pain"];
    }
    else if (symptomsLower.includes('cough') || symptomsLower.includes('cold') || symptomsLower.includes('throat') || symptomsLower.includes('flu') || symptomsLower.includes('sinus')) {
      customTitle = "Respiratory Path Humidification & Gargles";
      painReliefTip = "To ease a cough or deep sore throat, perform a warm saltwater gargle to soothe tissues. Sip warm honey- infused water to coat your throat, and use a humidifier or inhale steam from a shower.";
      customRemedies = [
        "Gargle gently with warm salt water (1/2 teaspoon salt in a glass of warm water) to soothe throat raw tissues",
        "Sip warm decaffeinated fluids like honey-lemon water to coat, lubricate, and shield the throat lining",
        "Use a humidifier or inhale warm steam from a warm shower to liquefy mucus and open nasal pathways"
      ];
      customCauses = ["Acute viral nasopharyngitis (Common Cold)", "Upper respiratory pharyngeal congestion"];
    }
    else if (symptomsLower.includes('muscle') || symptomsLower.includes('back') || symptomsLower.includes('neck') || symptomsLower.includes('ache') || symptomsLower.includes('soreness')) {
      customTitle = "Musculoskeletal Spasm Relaxation & Protective Resting";
      painReliefTip = "To relieve sore muscles, back aches, or cramps, rest the muscle group immediately. Apply warm compresses or heating pads to loosen tight spasms, and avoid any heavy lifting or sudden turns.";
      customRemedies = [
        "Apply mild warm heat to stiff, aching muscles to promote blood flow, or a cold pack for fresh swellings",
        "Utilize ergonomic support (e.g., place a rolled towel under your knees when lying down for lower back relief)",
        "Refrain from heavy lifting, aggressive bending, or fast spine twisting to prevent further muscle micro-tearing"
      ];
      customCauses = ["Postural muscle strain", "Localized soft tissue fatigue or paraspinal muscle spasm"];
    }
    else if (symptomsLower.includes('burn')) {
      customTitle = "Immediate Thermal Dissipation & Epidermal Protection";
      painReliefTip = "To soothe minor burn pain immediately, hold the skin under cool, gently running tap water for 10-20 minutes. Keep blisters intact to act as a natural barrier, and cover with a non-stick bandage.";
      customRemedies = [
        "Run cool, clean tap water over the affected burn wound for 10-15 minutes to dissipate thermal heat",
        "Never apply grease, butter, ice, or toothpaste, which isolate heat deep in tissues and invite bacteria",
        "Cover the raw area loosely using a sterile, non-adherent dressing to block irritating air currents"
      ];
      customCauses = ["Superficial heat or solar burn", "Focal epidermal cellular reaction"];
    }
    else if (symptomsLower.includes('cut') || symptomsLower.includes('scratch') || symptomsLower.includes('wound') || symptomsLower.includes('scrape') || symptomsLower.includes('bleeding')) {
      customTitle = "Mechanical Hemostasis & Antibacterial Shielding";
      painReliefTip = "To stop bleeding and calm pain, apply direct constant pressure with a clean cloth for 5-10 minutes. Clean the wound gently with water, dry thoroughly, and cover with a bandage.";
      customRemedies = [
        "Apply steady, direct pressure on the bleeding point using a clean sterile cloth to facilitate primary clotting",
        "Wash the wound outline gently with mild soap and clean running water to clean away superficial dirt",
        "Apply a thin layer of protective ointment (like plain petroleum jelly) and wrap in a clean, soft bandage"
      ];
      customCauses = ["Superficial skin abrasion or scrape", "Minor mechanical dermal laceration"];
    }
    else if (symptomsLower.includes('rash') || symptomsLower.includes('skin') || symptomsLower.includes('itch') || symptomsLower.includes('bite') || symptomsLower.includes('allergy')) {
      customTitle = "Dermal Soothing & Friction Reduction Measures";
      painReliefTip = "To calm itchy skin rashes or insect bites, apply a cool, damp compress. Dress in soft, loose cotton clothes and avoid scratching the area to prevent standard bacterial infections.";
      customRemedies = [
        "Apply a clean, cool, damp towel or cloth over the itchy skin rash to reduce localized skin hives",
        "Do not scratch the area; keep fingernails clean and cut short to prevent secondary bacterial infection",
        "Avoid using raw perfumed soaps, aggressive chemical moisturizers, or hot water on the affected epidermis"
      ];
      customCauses = ["Incipient contact dermatitis or mild eczema", "Insect bite reaction or localized environmental allergy"];
    }
    else if (symptomsLower.includes('tooth') || symptomsLower.includes('dental') || symptomsLower.includes('mouth') || symptomsLower.includes('gum')) {
      customTitle = "Oral Swelling Mitigation & Dental Nerval Numbing";
      painReliefTip = "To ease a throbbing toothache, rinse your mouth with warm salt water to clean debris, apply a cold pack to your outer cheek to numb nerves, and avoid eating cold, hot, or sugary foods.";
      customRemedies = [
        "Rinse and gargle gently with warm saline saltwater to flush away oral food debris and ease gum tension",
        "Hold a gel cold pack wrapped in a soft towel on your outer cheek over the sore side to calm deep dental nerves",
        "Avoid masticating food on the affected side; refrain from consuming freezing, piping hot, or high-sugar items"
      ];
      customCauses = ["Focal dental enamel sensitivity or nerve root inflammation", "Localized gingival or periodontal swelling"];
    }

    // 4. Combine base urgency framework with the custom symptom dynamicizer tips
    let customizedRationale = `${baseRationale} `;
    if (resolvedLevel === UrgencyLevel.EMERGENCY) {
      customizedRationale += "Due to the critical nature of these symptoms, please prioritize calling professional emergency responders immediately over any home relief. " + painReliefTip;
    } else {
      customizedRationale += `To help provide temporary comfort, we have compiled localized supportive remedies for your symptoms: ${painReliefTip}`;
    }

    return {
      level: resolvedLevel,
      title: `${customTitle} (${resolvedLevel === UrgencyLevel.EMERGENCY ? "Emergency" : resolvedLevel === UrgencyLevel.URGENT ? "Urgent Care advised" : resolvedLevel === UrgencyLevel.ROUTINE ? "Routine Clinic advised" : "Self-Care focus"})`,
      recommendation: baseRecommendation,
      rationale: customizedRationale,
      nextSteps: customRemedies,
      possibleCauses: customCauses,
      isFallback: true
    };
  }
}

export async function getAdaptiveFollowUp(
  messageHistory: { role: 'user' | 'assistant'; text: string }[],
  currentData: { age: string; gender: string; preExisting: string }
): Promise<AdaptiveQuestionResult> {
  try {
    const res = await fetch('/api/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messageHistory, currentData })
    });

    if (!res.ok) {
      let serverError = `HTTP error! status: ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.error) {
          serverError = errJson.error;
        }
      } catch (_) {}
      throw new Error(serverError);
    }

    const result = await res.json();
    return result as AdaptiveQuestionResult;
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    if (errorMsg.includes("expired") || errorMsg.includes("API key") || errorMsg.includes("API_KEY")) {
      console.warn("⚠️ [Adaptive Client Warning]: Key expired, falling back to local clinical interview tree:", errorMsg);
    } else {
      console.error("Adaptive interview error:", error);
    }
    
    // Fallback: Smart local dialogue follow-up engine
    const userMessages = messageHistory.filter(m => m.role === 'user');
    const userCount = userMessages.length;
    
    // Determine core symptom focus based on all user messages
    const fullDialogueToken = userMessages.map(m => m.text.toLowerCase()).join(" ");

    let question = "Could you tell me a bit more about the severity? How has it progressed over time?";
    let suggestions = ["It has been getting worse", "It remains stable", "It is on and off", "Not sure"];
    let isComplete = false;

    // After 3 responses, complete the intake
    if (userCount >= 3) {
      isComplete = true;
      question = "Thank you. I have gathered enough clinical correlation to finalize your triage profile. Please commit this medical case file to proceed.";
      suggestions = ["Finish Assessment"];
    } else {
      // Progressively ask highly relevant clinical triage questions
      if (fullDialogueToken.includes('chest') || fullDialogueToken.includes('breath') || fullDialogueToken.includes('heart') || fullDialogueToken.includes('tightness')) {
        if (userCount === 1) {
          question = "To ensure utmost safety: Do you feel any radiating tightness to your left arm, shoulder, back, or neck?";
          suggestions = ["No radiating pain", "Yes, left arm tightness", "Yes, radiating to shoulder/jaw", "Slight tingling sensation"];
        } else if (userCount === 2) {
          question = "Are you experiencing any accompanying sweating, dizziness, or nausea right now?";
          suggestions = ["No sweating or dizziness", "Yes, feel cold sweat", "Yes, feeling dizzy/faint", "Nauseous and clammy"];
        }
      } else if (fullDialogueToken.includes('cough') || fullDialogueToken.includes('cold') || fullDialogueToken.includes('throat') || fullDialogueToken.includes('fever') || fullDialogueToken.includes('flu') || fullDialogueToken.includes('nasal')) {
        if (userCount === 1) {
          question = "Understood. Are you experiencing any chills, bodily shivers, or difficulty swallowing fluid?";
          suggestions = ["Yes, chills and shivers", "Difficulty swallowing fluid", "No chills or difficulty", "Frequent sneezing"];
        } else if (userCount === 2) {
          question = "Do you have a productive cough (coughing up yellow/green mucus), or is it mostly dry and tickly?";
          suggestions = ["Dry, tickly cough", "Productive with clear mucus", "Productive with yellow mucus", "Short cough bursts"];
        }
      } else if (fullDialogueToken.includes('stomach') || fullDialogueToken.includes('belly') || (fullDialogueToken.includes('pain') && (fullDialogueToken.includes('cramp') || fullDialogueToken.includes('abdominal'))) || fullDialogueToken.includes('nausea') || fullDialogueToken.includes('vomit') || fullDialogueToken.includes('diarrhea')) {
        if (userCount === 1) {
          question = "Is the discomfort localized (e.g., lower right side, upper stomach) or diffuse across the whole belly?";
          suggestions = ["Lower right stomach", "Upper middle stomach", "Diffuse all over my belly", "Sharp local cramps"];
        } else if (userCount === 2) {
          question = "Have you been able to keep any fluids down, and when did you last eat a meal?";
          suggestions = ["Can keep water/tea down", "Unable to keep water down", "Last ate 4 hours ago", "Last ate over 12 hours ago"];
        }
      } else if (fullDialogueToken.includes('head') || fullDialogueToken.includes('headache') || fullDialogueToken.includes('migraine')) {
        if (userCount === 1) {
          question = "Is the pain concentrated on one side of your head with throbbing, or is it a band-like pressure on both sides?";
          suggestions = ["Pulsing on one side", "Pressure on both sides", "Behind my eyes", "Feels like overall tightness"];
        } else if (userCount === 2) {
          question = "Are you experiencing any sensory sensitivities, like bright lights or loud sounds bothering you?";
          suggestions = ["Yes, lights are painful", "Yes, sounds bother me", "Both light and sound", "No sensory sensitivity"];
        }
      } else if (fullDialogueToken.includes('muscle') || fullDialogueToken.includes('back') || fullDialogueToken.includes('neck') || fullDialogueToken.includes('joint') || fullDialogueToken.includes('leg') || fullDialogueToken.includes('arm')) {
        if (userCount === 1) {
          question = "Does the pain increase significantly if you press directly on the area, or is it deep inside the joint/muscle?";
          suggestions = ["Hurts to press directly", "Deep ache inside", "Only hurts when moving", "Feels stiff but no sharp pain"];
        } else if (userCount === 2) {
          question = "Are you experiencing any numbness, tingling, or weakness in your hands, fingers, or feet?";
          suggestions = ["No numbness or tingling", "Tingling in fingers/hands", "Numbness in foot/leg", "Weakness lifting items"];
        }
      } else {
        // Generic progressive questions
        if (userCount === 1) {
          question = "How would you describe the sensation? (e.g., sharp, burning, dull, cramping, throbbing)";
          suggestions = ["Dull, constant ache", "Sharp/stabbing on motion", "Burning sensation", "Mild throbbing"];
        } else if (userCount === 2) {
          question = "Are you experiencing any secondary issues, such as fatigue, localized swelling, or slight temperature?";
          suggestions = ["Feeling quite fatigued", "Slight localized swelling", "No other symptoms", "Mild low-grade heat"];
        }
      }
    }

    // Accumulate a formatted diagnostic outline
    const formattedSummary = `Patient Context (Local Fallback Analysis):\n` +
      `- Age/Sex: ${currentData.age || 'Unknown'}/${currentData.gender || 'Unknown'}\n` +
      `- Pre-existing: ${currentData.preExisting || 'None'}\n` +
      `- Patient Logs:\n  ` + 
      userMessages.map((m, i) => `Q${i+1}: ${m.text}`).join('\n  ');

    return {
      question,
      suggestions,
      isComplete,
      refinedSymptomsSummary: formattedSummary
    };
  }
}
