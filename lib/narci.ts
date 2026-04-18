import type { Goal, Profile, Product } from "@/types/database";
import { GOAL_LABELS } from "@/types/database";

export interface NarciMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NarciContext {
  profile: Partial<Profile> | null;
  recentScans?: { name: string; score: number; brand: string | null }[];
  currentProduct?: Product | null;
  isRamadan?: boolean;
}

function buildSystemPrompt(ctx: NarciContext): string {
  const p = ctx.profile ?? {};
  const goalLabel = p.goal ? GOAL_LABELS[p.goal as Goal] : "yok";
  const restrictions = [
    ...(p.health_conditions ?? []),
    ...(p.allergies ?? []),
    ...(p.dietary_restrictions ?? []),
  ].slice(0, 5).join(", ") || "yok";

  // En son 3 taramayı al (daha az token)
  const recentScansText = (ctx.recentScans ?? [])
    .slice(0, 3)
    .map((s) => `${s.name}:${s.score}`)
    .join(", ");

  const currentProductText = ctx.currentProduct
    ? ` Şu an taranan ürün: ${ctx.currentProduct.name}.`
    : "";

  // KISA sistem promptu - az token
  return `Sen Narcı, Türkçe beslenme koçu asistansın. Kısa (2-3 cümle), samimi, pratik cevap ver. "Sağlıksız/iyi gıda" deme, "hedefinle uyumlu/değil" de. Tıbbi tanı koyma - diyetisyene yönlendir.
Kullanıcı: hedef=${goalLabel}, yaş=${p.age ?? "?"}, cinsiyet=${p.gender ?? "?"}, kısıtlama=${restrictions}.
Son taramalar: ${recentScansText || "yok"}.${currentProductText}${ctx.isRamadan ? " Ramazan zamanı." : ""}`;
}

export async function sendMessage(
  history: NarciMessage[],
  userMessage: string,
  context: NarciContext,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı. .env dosyasını kontrol et.");
  }

  const systemPrompt = buildSystemPrompt(context);

  // Son 5 mesajı al (daha az token)
  const recent = history.slice(-5);

  interface GeminiContent {
    role: "user" | "model";
    parts: { text: string }[];
  }
  const contents: GeminiContent[] = [];

  // Sistem promptunu ilk turn olarak ekle
  contents.push({
    role: "user",
    parts: [{ text: systemPrompt }],
  });
  contents.push({
    role: "model",
    parts: [{ text: "Anlaşıldı." }],
  });

  for (const msg of recent) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  // gemini-2.0-flash-lite: daha yüksek free tier quota, daha hızlı, daha ucuz
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;

  // 20s timeout: kullanıcının gelen abort sinyaliyle birleştir
  const timeoutCtrl = new AbortController();
  const timer = setTimeout(() => timeoutCtrl.abort(), 20_000);
  const onUserAbort = () => timeoutCtrl.abort();
  signal?.addEventListener("abort", onUserAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      }),
      signal: timeoutCtrl.signal,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onUserAbort);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Gemini API hatası:", res.status, errorBody);
    if (res.status === 401 || res.status === 403) {
      throw new Error("API anahtarı geçersiz veya yetkin yok.");
    }
    if (res.status === 429) {
      // Quota limit - retryDelay "48s" gibi geliyor, saniyeye çevir
      let seconds = 60;
      try {
        const parsed = JSON.parse(errorBody);
        const details = parsed?.error?.details ?? [];
        const retry = details.find((d: any) => d["@type"]?.includes("RetryInfo"));
        const raw = retry?.retryDelay ?? "";
        const match = /^(\d+)s$/.exec(raw);
        if (match) seconds = parseInt(match[1], 10);
      } catch {
        // RetryInfo parse edilemedi — varsayılan 60 saniye ile devam
      }
      const label = seconds < 60 ? `${seconds} saniye` : `${Math.ceil(seconds / 60)} dakika`;
      throw new Error(`Dakikalık kullanım limiti doldu. ${label} sonra tekrar dene.`);
    }
    if (res.status === 404) {
      throw new Error("Model bulunamadı. API anahtarı eski olabilir.");
    }
    throw new Error("Şu an cevap veremiyorum, az sonra tekrar dene.");
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Bir şey ters gitti, tekrar dener misin?";

  return text.trim();
}

export function isRamadanNow(): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const ranges: Record<number, [string, string]> = {
    2026: ["2026-02-17", "2026-03-19"],
    2027: ["2027-02-07", "2027-03-08"],
    2028: ["2028-01-27", "2028-02-25"],
  };
  const range = ranges[year];
  if (!range) return false;
  const nowStr = now.toISOString().slice(0, 10);
  return nowStr >= range[0] && nowStr <= range[1];
}
