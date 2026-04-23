import type { Goal, Profile, Product, HealthMode } from "@/types/database";
import { GOAL_LABELS } from "@/types/database";
import { buildPersonalityPrompt, getPersonalityTone } from "./personalities";
import { buildHealthModePrompt, maybeAddMedicalDisclaimer } from "./mizan";

export interface NarciMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NarciContext {
  profile: Partial<Profile> | null;
  recentScans?: { name: string; score: number; brand: string | null }[];
  currentProduct?: Product | null;
  isRamadan?: boolean;
  mood?: "great" | "good" | "ok" | "low" | "tired" | null;
  todayMeals?: { name: string; calories: number; protein: number }[];
  todayTotals?: { calories: number; protein: number; fat: number; carbs: number };
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

  // Kişilik modu — default 'anne'
  const personality = p.narci_personality ?? "anne";
  const personalityPrompt = buildPersonalityPrompt(personality);

  // Mizan — sağlık modları
  const healthModes = (p.health_modes ?? []) as HealthMode[];
  const healthPrompt = buildHealthModePrompt(healthModes);

  // Ortak kurallar (her kişilik için geçerli)
  const commonRules = `
KURALLAR (hepsinde geçerli):
- Kısa cevap ver (2-4 cümle yeterli)
- "Sağlıksız/iyi gıda" deme — "hedefinle uyumlu/değil" de
- Tıbbi tanı koyma — "diyetisyen/doktorunla konuş" de
- Asla love bombing veya pohpohlama yapma
- Dürüst geri bildirim ver, ama ton kişiliğe uygun olsun
- UYUM-NÖTR: Kullanıcı hedefinden saptıysa "kaçırdın/başaramadın/yapmamalıydın" ASLA DEME. Gerçekte ne olduğunu yargısız kabul et, haftalık bağlamla yumuşat, bir sonraki adımı öner.`;

  const moodLabels: Record<string, string> = {
    great: "harika", good: "iyi", ok: "normal", low: "düşük", tired: "yorgun",
  };
  const moodText = ctx.mood ? ` Bugünkü ruh hali: ${moodLabels[ctx.mood]}.` : "";

  // Bugünkü yemekler + toplam
  const mealsText = (ctx.todayMeals ?? []).length > 0
    ? `\n- Bugün yedikleri: ${ctx.todayMeals!.map((m) => `${m.name}(${m.calories}kcal)`).join(", ")}.`
    : "";
  const totals = ctx.todayTotals;
  const totalsText = totals && totals.calories > 0
    ? `\n- Bugünkü toplam: ${totals.calories} kcal, ${totals.protein}g protein, ${totals.fat}g yağ, ${totals.carbs}g karb.`
    : "";

  const userContext = `
Kullanıcı bilgisi:
- Hedef: ${goalLabel}
- Yaş: ${p.age ?? "?"}
- Cinsiyet: ${p.gender ?? "?"}
- Kısıtlama/sağlık: ${restrictions}
- Son taramalar: ${recentScansText || "yok"}.${currentProductText}${ctx.isRamadan ? " Ramazan zamanı." : ""}${moodText}${mealsText}${totalsText}`;

  return `${personalityPrompt}${healthPrompt}\n${commonRules}\n${userContext}`;
}

// Mesaj başı max karakter — token optimizasyonu
const MAX_MSG_CHARS = 400;
// Geçmişten tutulacak son mesaj sayısı
const HISTORY_LIMIT = 4;
// Exponential backoff: 1s, 2s, 4s (toplam 7s + anlık)
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function trimMessage(text: string): string {
  if (text.length <= MAX_MSG_CHARS) return text;
  return text.slice(0, MAX_MSG_CHARS) + "…";
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}

function parseRetryDelaySec(errorBody: string): number | null {
  try {
    const parsed = JSON.parse(errorBody);
    const details = parsed?.error?.details ?? [];
    const retry = details.find((d: any) => d["@type"]?.includes("RetryInfo"));
    const raw = retry?.retryDelay ?? "";
    const match = /^(\d+)s$/.exec(raw);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

// Acil durum tetikleyicileri — kullanıcı AI'dan tıbbi/psikolojik kriz yardımı isterse
// AI bunu asla yanıtlamamalı, profesyonel yönlendirme yapmalı (App Store gereksinimi)
const HARMFUL_TRIGGERS = [
  "intihar", "kendime zarar", "yaşamak istemiyorum", "kendimi öldür",
  "suicide", "self-harm", "hurt myself", "kill myself",
  "yemek yemek istemiyorum", "anoreksi", "bulimi", "kusturuyorum",
];

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return HARMFUL_TRIGGERS.some((t) => lower.includes(t));
}

const CRISIS_RESPONSE = `Seni duyuyorum. Şu an zor bir zamandan geçiyorsun.

Lütfen hemen bir uzmanla konuş:

🇹🇷 **Türkiye**
• 182 — Sağlık Bakanlığı MHRS (7/24)
• 112 — Acil
• RUSİHAK İntihar Önleme: 0 212 219 45 65

🌍 **Global**
• findahelpline.com — ülkene göre hat

Ben bir beslenme koçuyum, bu tür durumlar için eğitimli değilim. Ama yalnız değilsin, gerçek bir insan seni dinlemek için hazır.`;

export async function sendMessage(
  history: NarciMessage[],
  userMessage: string,
  context: NarciContext,
  signal?: AbortSignal
): Promise<string> {
  // Acil durum kontrolü — Gemini'ye hiç göndermeden direkt yönlendir
  if (detectCrisis(userMessage)) {
    return CRISIS_RESPONSE;
  }

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı. .env dosyasını kontrol et.");
  }

  const systemPrompt = buildSystemPrompt(context);

  // Son N mesajı al + her birini kırp (token optimizasyonu)
  const recent = history.slice(-HISTORY_LIMIT);

  interface GeminiContent {
    role: "user" | "model";
    parts: { text: string }[];
  }
  const contents: GeminiContent[] = [];

  // Sistem promptunu ilk turn olarak ekle
  contents.push({ role: "user", parts: [{ text: systemPrompt }] });
  contents.push({ role: "model", parts: [{ text: "Anlaşıldı." }] });

  for (const msg of recent) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: trimMessage(msg.content) }],
    });
  }

  contents.push({ role: "user", parts: [{ text: trimMessage(userMessage) }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
  const toneConfig = getPersonalityTone(context.profile?.narci_personality ?? "anne");

  const body = JSON.stringify({
    contents,
    generationConfig: {
      temperature: toneConfig.temperature,
      maxOutputTokens: toneConfig.maxTokens,
    },
  });

  // Exponential backoff döngüsü — 429 ve 5xx için
  let lastErrorBody = "";
  let lastStatus = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Her deneme için ayrı timeout controller
    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(), 20_000);
    const onUserAbort = () => timeoutCtrl.abort();
    signal?.addEventListener("abort", onUserAbort);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: timeoutCtrl.signal,
      });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onUserAbort);
    }

    if (res.ok) {
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Bir şey ters gitti, tekrar dener misin?";
      const hasHealthMode = (context.profile?.health_modes ?? []).length > 0;
      return text.trim() + maybeAddMedicalDisclaimer(hasHealthMode);
    }

    lastStatus = res.status;
    lastErrorBody = await res.text();
    console.error(`Gemini API hatası (deneme ${attempt + 1}):`, res.status);

    // Retry edilmeyecek hatalar — hemen fırlat
    if (res.status === 401 || res.status === 403) {
      throw new Error("API anahtarı geçersiz veya yetkin yok.");
    }
    if (res.status === 404) {
      throw new Error("Model bulunamadı. API anahtarı eski olabilir.");
    }
    if (res.status === 400) {
      throw new Error("İstek reddedildi, az sonra tekrar dene.");
    }

    // 429 ve 5xx — retry edilebilir
    const shouldRetry = (res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES;
    if (!shouldRetry) break;

    // Backoff süresi: sunucu retryDelay verdiyse onu kullan (10s'e kadar), yoksa exponential
    const serverDelaySec = res.status === 429 ? parseRetryDelaySec(lastErrorBody) : null;
    const backoffMs =
      serverDelaySec !== null && serverDelaySec <= 10
        ? serverDelaySec * 1000
        : BASE_BACKOFF_MS * Math.pow(2, attempt);

    try {
      await sleep(backoffMs, signal);
    } catch {
      // Abort edilirse döngüyü kır
      throw new DOMException("Aborted", "AbortError");
    }
  }

  // Tüm denemeler tükendi
  if (lastStatus === 429) {
    const serverDelaySec = parseRetryDelaySec(lastErrorBody) ?? 60;
    const label =
      serverDelaySec < 60 ? `${serverDelaySec} saniye` : `${Math.ceil(serverDelaySec / 60)} dakika`;
    throw new Error(`Dakikalık kullanım limiti doldu. ${label} sonra tekrar dene.`);
  }
  throw new Error("Şu an cevap veremiyorum, az sonra tekrar dene.");
}

export function isRamadanNow(): boolean {
  // PASIF: Ramazan modu şu an kapalı.
  // Tekrar aktifleştirmek için return false; satırını sil,
  // aşağıdaki kodu uncomment et.
  return false;

  // const now = new Date();
  // const year = now.getFullYear();
  // const ranges: Record<number, [string, string]> = {
  //   2026: ["2026-02-17", "2026-03-19"],
  //   2027: ["2027-02-07", "2027-03-08"],
  //   2028: ["2028-01-27", "2028-02-25"],
  // };
  // const range = ranges[year];
  // if (!range) return false;
  // const nowStr = now.toISOString().slice(0, 10);
  // return nowStr >= range[0] && nowStr <= range[1];
}
