
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

// Helper to resize base64 images if they exceed dimensions/size
async function resizeBase64(base64Str: string, maxWidth = 1536, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      if (img.width <= maxWidth && img.height <= maxWidth) {
        resolve(base64Str);
        return;
      }
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
}

export const performGenerativeFill = async (
  imageBase64: string,
  maskBase64: string,
  prompt: string,
  depthMapBase64?: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Otimização de carga
  const optimizedImage = await resizeBase64(imageBase64);
  const cleanImage = optimizedImage.split(",")[1];
  const cleanMask = maskBase64.split(",")[1];

  // Pipeline de Inpainting com guia estrutural
  const basePrompt = `TASK: Generative Fill. Prompt: ${prompt}. 
    INSTRUCTION: Fill the masked area seamlessly. 
    ${depthMapBase64 ? "GUIDE: Use the provided depth map to maintain perspective and object scale." : ""} 
    QUALITY: Photorealistic, cinematic lighting, 8k.`;

  const generateVariation = async (seed: number) => {
    const parts: any[] = [
      { text: basePrompt },
      { inlineData: { mimeType: optimizedImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png', data: cleanImage } },
      { inlineData: { mimeType: 'image/png', data: cleanMask } }
    ];

    if (depthMapBase64) {
      parts.push({ text: "Reference Depth Map for structural guidance:" });
      parts.push({ inlineData: { mimeType: 'image/png', data: depthMapBase64.split(",")[1] } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { seed }
    });

    const respParts = response.candidates?.[0]?.content?.parts;
    if (respParts) {
        for (const part of respParts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  };

  // Gerar 3 variações simultâneas com sementes diferentes
  const seeds = [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)];
  const results = await Promise.all(seeds.map(s => generateVariation(s)));
  
  return results.filter(Boolean) as string[];
};

export const performInpainting = async (
  imageBase64: string,
  maskBase64: string,
  prompt: string,
  styleDescriptors: string = ""
): Promise<string | null> => {
  const variations = await performGenerativeFill(imageBase64, maskBase64, prompt);
  return variations[0] || null;
};
