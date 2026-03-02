
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getTreatmentSuggestions(complaint: string, medicalHistory: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a treatment plan for a dental patient with:
        Complaint: ${complaint}
        Medical History: ${medicalHistory.join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedProcedures: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notes: { type: Type.STRING }
          },
          required: ["suggestedProcedures", "warnings", "notes"]
        }
      }
    });
    // The .text property is a getter, do not call it as a method.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
