import type { Nutrition } from "@/types/database";
import { reportError } from "./analytics";

export interface OCRResult {
  nutrition: Nutrition;
  productName?: string;
  brand?: string;
  confidence: "high" | "low";
}

/**
 * Besin etiketi fotoğrafını Gemini Vision ile analiz eder.
 * Base64 encoded görüntü verir, JSON nutrition döner.
 */
export async function extractNutritionFromImage(base64: string): Promise<OCRResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("OCR: Gemini API key yok");
    return null;
  }

  const prompt = `Bu bir besin etiketi fotoğrafı. 100g veya porsiyon başına değerleri oku ve JSON olarak ver. Sadece JSON döndür, başka metin yok.

Format:
{
  "productName": "ürün adı varsa, yoksa null",
  "brand": "marka varsa, yoksa null",
  "per100g": true ya da false (değerler 100g için mi?),
  "calories": sayı (kcal),
  "sugar": sayı (g),
  "saturated_fat": sayı (g),
  "fat": sayı (g),
  "sodium": sayı (mg — etiket 'salt' veriyorsa tuz_g × 400 = mg),
  "fiber": sayı (g),
  "protein": sayı (g),
  "serving_size_g": porsiyon gramı
}

Okuyamadığın değerler için 0 yaz. Yalnızca JSON döndür.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn("OCR response not ok:", response.status, body.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);

    const nutrition: Nutrition = {
      calories: Math.round(Number(parsed.calories) || 0),
      sugar: Number(parsed.sugar) || 0,
      saturated_fat: Number(parsed.saturated_fat) || 0,
      fat: Number(parsed.fat) || 0,
      sodium: Math.round(Number(parsed.sodium) || 0),
      fiber: Number(parsed.fiber) || 0,
      protein: Number(parsed.protein) || 0,
      serving_size_g: Number(parsed.serving_size_g) || 100,
    };

    // Eğer değerler 100g için değilse, 100g'a oranla
    if (parsed.per100g === false && nutrition.serving_size_g > 0) {
      const factor = 100 / nutrition.serving_size_g;
      nutrition.calories = Math.round(nutrition.calories * factor);
      nutrition.sugar = Number((nutrition.sugar * factor).toFixed(1));
      nutrition.saturated_fat = Number((nutrition.saturated_fat * factor).toFixed(1));
      nutrition.fat = Number((nutrition.fat * factor).toFixed(1));
      nutrition.sodium = Math.round(nutrition.sodium * factor);
      nutrition.fiber = Number((nutrition.fiber * factor).toFixed(1));
      nutrition.protein = Number((nutrition.protein * factor).toFixed(1));
    }

    const hasValid = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.fat > 0;

    return {
      nutrition,
      productName: parsed.productName ?? undefined,
      brand: parsed.brand ?? undefined,
      confidence: hasValid ? "high" : "low",
    };
  } catch (e) {
    reportError(e, { where: "extractNutritionFromImage" });
    return null;
  }
}
