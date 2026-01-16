
import { GoogleGenAI } from "@google/genai";

export interface InpaintPayload {
  imageBase64: string;
  maskBase64: string;
  prompt: string;
}

// Utilitário para redimensionar imagens mantendo aspect ratio para evitar erro 400 da API (Payload too large)
async function optimizeImageForAI(base64Str: string, maxDim = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(base64Str);
        return;
      }
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxDim / img.width, maxDim / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Usar JPEG 0.9 para compressão eficiente sem perder muita qualidade visual para a IA
        resolve(canvas.toDataURL('image/jpeg', 0.9)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
}

export const executeGenerativeFill = async (payload: InpaintPayload): Promise<string | null> => {
  // Fix: Instantiating GoogleGenAI here ensures it picks up the latest process.env.API_KEY if changed in SettingsLab.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // 1. Otimização de Payload (Critical Path)
    const optimizedImage = await optimizeImageForAI(payload.imageBase64);
    
    // Remover cabeçalhos Data URL
    const cleanImage = optimizedImage.split(",")[1];
    const cleanMask = payload.maskBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    // 2. Engenharia de Prompt para o Modelo de Edição
    // Forçamos o modelo a entender que é uma tarefa de edição de imagem baseada em máscara
    const systemInstruction = "You are a professional image editor tool. Perform the requested edit seamlessly within the masked area. Output ONLY the resulting image.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Modelo otimizado para visão/edição
      contents: {
        parts: [
          { text: payload.prompt },
          { inlineData: { mimeType: 'image/jpeg', data: cleanImage } }, // Imagem Base
          { inlineData: { mimeType: 'image/png', data: cleanMask } },   // Máscara (PNG necessário para transparência/binário)
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        // responseMimeType: 'image/png' // Nem sempre suportado por todos os modelos, deixamos o modelo decidir o melhor formato de retorno
      }
    });

    // 3. Extração Robusta
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data returned from Neural Core.");
  } catch (error: any) {
    console.error("V-nus Gemini Bridge Error:", error);
    throw new Error(error.message || "AI Connection Failed");
  }
};
