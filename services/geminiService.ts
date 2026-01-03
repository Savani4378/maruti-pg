
import { GoogleGenAI } from "@google/genai";
import { Resident } from "../types";

export const generatePoliceForm = async (resident: Resident): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Generate a professional and formal "Police Verification Form" content for a hostel resident.
    Resident Details:
    - Name: ${resident.firstName} ${resident.lastName}
    - Room Number: ${resident.roomNumber}
    - Hostel Number: ${resident.hostelNumber}
    - Joining Date: ${resident.joiningDate}
    - Contact: ${resident.contactNumber}

    The form should include placeholders for permanent address, identification marks, and declaration.
    Output the content in a structured, easy-to-read Markdown format that looks like a legal document.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate form.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI service.";
  }
};
