
import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedTicketData } from '../types';

declare var process: any;

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder. In a real app, the key is expected to be in the environment.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const extractTicketDetailsFromImage = async (
  imageBase64: string,
  mimeType: string
): Promise<ExtractedTicketData> => {
  try {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = {
      text: "Analyze this event ticket image and extract the following details. The ticket might be in Hebrew. Pay close attention to dates. Interpret two-digit years (e.g., '25) as being in the 21st century (e.g., 2025) and ensure the year is correctly identified. The parsing order for Hebrew dates should be day, then month, then year. Provide the final extracted date in YYYY-MM-DD format. If you cannot find a detail, return an empty string for that field. Give a brief description or gist of the barcode/QR code, but do not try to decode it."
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING, description: "שם האירוע" },
            date: { type: Type.STRING, description: "תאריך האירוע בפורמט YYYY-MM-DD" },
            time: { type: Type.STRING, description: "שעת האירוע" },
            location: { type: Type.STRING, description: "מיקום האירוע" },
            ticketType: { type: Type.STRING, description: "סוג הכרטיס (למשל, כניסה, VIP, אוכל)" },
            barcodeQRGist: { type: Type.STRING, description: "תיאור קצר של הברקוד או קוד ה-QR" },
          }
        }
      }
    });

    const text = response.text;
    const jsonString = text ? text.trim() : "{}";
    const parsedData = JSON.parse(jsonString);

    // Validate that it fits the expected structure
    if (
        typeof parsedData.eventName !== 'string' ||
        typeof parsedData.date !== 'string' ||
        typeof parsedData.time !== 'string' ||
        typeof parsedData.location !== 'string' ||
        typeof parsedData.ticketType !== 'string' ||
        typeof parsedData.barcodeQRGist !== 'string'
    ) {
        throw new Error("Parsed JSON does not match expected schema.");
    }
    
    return parsedData as ExtractedTicketData;

  } catch (error) {
    console.error("Error extracting ticket details from Gemini:", error);
    throw new Error("לא הצלחנו לקרוא את פרטי הכרטיס. נסה שוב או מלא את הפרטים ידנית.");
  }
};
