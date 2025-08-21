import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
export const askGemini = async (req, res) => {
  const { prompt } = req.body;

  try{
    
    const response  = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
      systemInstruction: "You are a concise AI assistant that always responds with short, direct answers without asking unnecessary questions. Do not give step-by-step explanations or multiple options unless explicitly requested. If the user asks for a message (like a birthday wish), give a single final, ready-to-use message without extra context.",
    },
    });
      const text = response.text;
      res.json({ response: text });
  }catch(error){
    console.error("Gemini Error:", error.message || error);
    res.status(500).json({ error: "AI Assistant unavailable" });
  }
};

export const getQuickRepliesFromAI = async (req, res) => {
  const { lastMessage, authUserId } = req.body;

  if (!lastMessage || !lastMessage.text) {
    return res.status(400).json({ error: "Last message text is required" });
  }

  // Skip suggestion if last message was sent by auth user
  if (lastMessage.senderId === authUserId) {
    return res.status(200).json({ suggestions: [] });
  }

  const prompt = 
`You are a helpful assistant. Suggest 3 short and natural replies for this message:

"${lastMessage.text}"

Return the replies in a JSON array of strings. Do not include any explanation, only the JSON.`
;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let text = response.text; 

    // ✅ Strip code block formatting
    text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();

    const suggestions = JSON.parse(text);
    res.json({ suggestions });
  } catch (error) {
    console.error("Quick Replies Error:", error.message || error);
    res.status(500).json({ error: "Failed to get quick replies" });
  }
};
