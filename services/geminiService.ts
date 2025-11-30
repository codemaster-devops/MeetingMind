import { GoogleGenAI, Schema, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert executive assistant and meeting scribe. 
Your task is to analyze the provided meeting input (either audio or text transcript) and produce a structured analysis.
You must extract:
1. A verbatim-style transcript (if audio is provided) or cleaned up text (if text is provided).
2. A concise summary of key discussion points.
3. A list of specific decisions made during the meeting.
4. A list of action items, identifying who is responsible and the due date (if mentioned). If no due date is mentioned, use "TBD". If no owner is clear, use "Unassigned".

Output strict JSON.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: {
      type: Type.STRING,
      description: "The full text transcript of the meeting.",
    },
    summary_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of key points discussed.",
    },
    decisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of decisions agreed upon.",
    },
    action_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          owner: { type: Type.STRING, description: "Person responsible" },
          description: { type: Type.STRING, description: "Task description" },
          due_date: { type: Type.STRING, description: "Due date or TBD", nullable: true },
        },
        required: ["owner", "description"],
      },
      description: "List of action items.",
    },
  },
  required: ["transcript", "summary_points", "decisions", "action_items"],
};

/**
 * Determine MIME type based on file property or extension fallback.
 */
const getMimeType = (file: File): string => {
  if (file.type && file.type !== '') return file.type;
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4', // Common fallback for m4a
    'mp4': 'audio/mp4', // Treat mp4 as audio for this context often
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'webm': 'video/webm',
  };
  return mimeMap[ext || ''] || 'audio/mpeg'; // Default to mp3 if unknown
};

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        const mimeType = getMimeType(file);
        console.log(`Prepared file payload: ${mimeType}, Size: ~${Math.round(base64String.length / 1024)}KB`);
        resolve({
          inlineData: {
            data: base64String,
            mimeType: mimeType,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const modelId = "gemini-2.5-flash"; 

export const analyzeMeetingAudio = async (audioFile: File): Promise<MeetingAnalysis> => {
  try {
    console.log("Starting audio analysis for:", audioFile.name);
    
    // 1. Prepare the audio part
    const audioPart = await fileToGenerativePart(audioFile);

    // 2. Call the API
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [
          audioPart,
          { text: "Analyze this meeting audio. Generate the transcript, summary, decisions, and action items." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response text received from the model.");

    // 3. Parse JSON
    console.log("Response received, parsing JSON...");
    const data = JSON.parse(responseText) as MeetingAnalysis;
    return data;

  } catch (error) {
    console.error("Error processing meeting audio:", error);
    throw error;
  }
};

export const analyzeMeetingTranscript = async (transcriptText: string): Promise<MeetingAnalysis> => {
    try {
      console.log("Starting text analysis, length:", transcriptText.length);
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          role: "user",
          parts: [
            { text: `Here is the transcript/notes of a meeting:\n\n${transcriptText}\n\nAnalyze this text. Generate the summary, decisions, and action items. Retain the transcript text in the output.` }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        }
      });
  
      const responseText = response.text;
      if (!responseText) throw new Error("No response text received from the model.");
  
      console.log("Response received, parsing JSON...");
      const data = JSON.parse(responseText) as MeetingAnalysis;
      return data;
  
    } catch (error) {
      console.error("Error processing meeting transcript:", error);
      throw error;
    }
  };
