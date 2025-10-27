import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const SYSTEM_INSTRUCTIONS = {
  default: "You are a helpful AI assistant. Be concise and friendly.",
  professional: "You are a professional AI assistant. Provide clear, structured, and informative responses. Use formal language and be comprehensive in your explanations.",
  friendly: "You are a friendly and approachable AI assistant. Use a warm, conversational tone. Make your responses engaging and easy to understand.",
  technical: "You are a technical AI assistant. Provide detailed, accurate technical explanations with code examples when relevant. Be precise and thorough.",
  creative: "You are a creative and enthusiastic AI assistant. Use vivid language, examples, and metaphors. Make your responses inspiring and memorable.",
  educational: "You are an educational AI assistant. Explain concepts step-by-step, use analogies, and check for understanding. Be patient and encouraging.",
  brief: "You are a concise AI assistant. Get straight to the point. Provide short, direct answers without unnecessary elaboration.",
};

async function callGeminiAPIWithRetry(parts, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      if (!text) return "No response from AI";
      return text;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < retries && (error.message.includes("503") || error.message.includes("429"))) {
        const waitTime = delay * Math.pow(2, attempt);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}


export async function POST(req) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_API_KEY is not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const contentType = req.headers.get('content-type');
    let messages, systemInstruction, customInstruction, imageData = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const message = formData.get('message');
      const messagesStr = formData.get('messages');
      const imageFile = formData.get('image');
      
      messages = JSON.parse(messagesStr);
      systemInstruction = formData.get('systemInstruction') || 'default';
      customInstruction = formData.get('customInstruction');
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageData = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: imageFile.type,
          }
        };
      }
    } else {

      const body = await req.json();
      messages = body.messages;
      systemInstruction = body.systemInstruction || 'default';
      customInstruction = body.customInstruction;
    }
    let systemPrompt = SYSTEM_INSTRUCTIONS[systemInstruction] || SYSTEM_INSTRUCTIONS.default;
    if (customInstruction) {
      systemPrompt = customInstruction;
    }
    const parts = [{ text: systemPrompt }];
    messages.forEach(m => {
      if (m.role === 'user') {
        parts.push({ text: `User: ${m.content}` });
      } else {
        parts.push({ text: `Assistant: ${m.content}` });
      }
    });
    if (imageData) {
      parts.push(imageData);
    }
    console.log('Using system instruction:', systemInstruction);
    console.log('Has image:', !!imageData);
    const reply = await callGeminiAPIWithRetry(parts);

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Final error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
