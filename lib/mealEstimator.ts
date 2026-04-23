export interface MealEstimate {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const VISION_MODEL_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

const TEXT_MODEL_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;

/**
 * Kullanıcı "1 tabak pilav, köfte ve ayran" gibi yazar.
 * Gemini'den JSON olarak kalori + makro tahmini döndürür.
 */
export async function estimateMeal(
  description: string,
  signal?: AbortSignal
): Promise<MealEstimate> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı.");
  }

  const prompt = `Aşağıdaki yemek tanımı için yaklaşık besin değeri tahmini yap.
Türkçe yemekler (pide, mantı, kuru fasulye, lahmacun vb.) tanırsın.
Sadece geçerli JSON döndür, başka metin yok:
{
  "name": "kısa Türkçe başlık (max 40 karakter)",
  "calories": tam sayı,
  "protein": tam sayı gram,
  "fat": tam sayı gram,
  "carbs": tam sayı gram
}

Tanım: "${description}"`;

  const url = TEXT_MODEL_URL(apiKey);

  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), 15_000);
  const onUserAbort = () => timeoutCtrl.abort();
  signal?.addEventListener("abort", onUserAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      }),
      signal: timeoutCtrl.signal,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onUserAbort);
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Dakikalık limit doldu, 1-2 dakika sonra tekrar dene.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("API yetki hatası. Lütfen destek ekibine bildir.");
    }
    throw new Error(`Tahmin alınamadı (${res.status}). Tekrar dene.`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    // Gemini bazen ```json ... ``` fence'i ile dönüyor
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      name: String(parsed.name ?? description.slice(0, 40)),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
    };
  } catch {
    throw new Error("Tahmin okunamadı. Daha net yaz (ör: '1 tabak mercimek çorbası').");
  }
}

/**
 * Fotoğraftan yemek tahmini (Gemini Vision).
 * base64 string al, JSON estimate dön.
 */
export async function estimateMealFromPhoto(
  base64: string,
  mimeType: string = "image/jpeg",
  signal?: AbortSignal
): Promise<MealEstimate> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı.");
  }

  const prompt = `Bu fotoğrafta gördüğün yemeği analiz et.
Türkçe yemekler (pide, mantı, kuru fasulye, lahmacun vb.) tanırsın.
Tabağın/porsiyonun büyüklüğünü göz önünde bulundur.
Görünmez malzemeler (yağ, tereyağı, sos) için makul tahmin ekle.
Sadece geçerli JSON döndür:
{
  "name": "kısa Türkçe başlık (max 40 karakter)",
  "calories": tam sayı,
  "protein": tam sayı gram,
  "fat": tam sayı gram,
  "carbs": tam sayı gram
}
Eğer fotoğrafta yemek görmezsen calories:0 dön.`;

  const url = VISION_MODEL_URL(apiKey);

  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), 25_000);
  const onUserAbort = () => timeoutCtrl.abort();
  signal?.addEventListener("abort", onUserAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      }),
      signal: timeoutCtrl.signal,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onUserAbort);
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Dakikalık limit doldu, 1-2 dakika sonra tekrar dene.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("API yetki hatası. Lütfen destek ekibine bildir.");
    }
    throw new Error(`Fotoğraf analizi başarısız (${res.status}). Tekrar dene.`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const calories = Math.max(0, Math.round(Number(parsed.calories) || 0));
    if (calories === 0) {
      throw new Error("Fotoğrafta yemek algılanamadı. Daha net bir kare dene.");
    }
    return {
      name: String(parsed.name ?? "Bilinmeyen yemek"),
      calories,
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
    };
  } catch (e: any) {
    if (e?.message?.includes("algılanamadı")) throw e;
    throw new Error("Analiz okunamadı. Tekrar dene.");
  }
}
