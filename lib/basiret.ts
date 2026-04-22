import type { Product, Profile, HealthMode } from "@/types/database";

export type BasiretLevel = "yesil" | "sari" | "turuncu";

export interface BasiretResult {
  level: BasiretLevel;
  message: string;
  suggestion?: string;
  icon: "🟢" | "🟡" | "🟠";
}

/**
 * Yemekten ÖNCE karar. Kullanıcı sağlık durumu + ürün profili ile
 * yeşil/sarı/turuncu bir ön-değerlendirme üretir.
 * Skor'dan bağımsız — sağlık moduna özel riski göstermek amaçlı.
 */
export function analyzeBasiret(
  product: Product,
  profile: Partial<Profile>
): BasiretResult | null {
  const healthModes = (profile.health_modes ?? []) as HealthMode[];
  const nutrition = product.nutrition;

  // Mizan aktif değilse Basiret göstermiyoruz — skor zaten var
  if (healthModes.length === 0) return null;

  // Beslenme verisi yoksa pas geç
  if (!nutrition) {
    return {
      level: "sari",
      icon: "🟡",
      message: "Besin bilgisi yetersiz",
      suggestion: "Etiketi kontrol et, porsiyonu küçük tut.",
    };
  }

  const sugar = nutrition.sugar || 0;
  const satFat = nutrition.saturated_fat || 0;
  const sodium = nutrition.sodium || 0;
  const protein = nutrition.protein || 0;
  const calories = nutrition.calories || 0;

  // 1) GLP-1 kullanıcısı
  if (healthModes.includes("glp1")) {
    if (sugar > 15) {
      return {
        level: "turuncu",
        icon: "🟠",
        message: "Şu an sana ağır gelebilir",
        suggestion: "GLP-1 midede işi yavaşlatıyor. Yarım porsiyon + protein öner.",
      };
    }
    if (protein < 5 && calories > 200) {
      return {
        level: "sari",
        icon: "🟡",
        message: "Protein az, yanına bir şey ekle",
        suggestion: "Yoğurt, yumurta veya peynir iyi tamamlar.",
      };
    }
  }

  // 2) Diyabet kullanıcısı
  if (healthModes.includes("diabet_1") || healthModes.includes("diabet_2")) {
    const hour = new Date().getHours();
    if (sugar > 20 && (hour >= 22 || hour < 6)) {
      return {
        level: "turuncu",
        icon: "🟠",
        message: "Gece için çok şekerli",
        suggestion: "Kan şekerin yükselir. Yarına saklayalım mı?",
      };
    }
    if (sugar > 15) {
      return {
        level: "sari",
        icon: "🟡",
        message: "Glisemik etki yüksek",
        suggestion: "Yanına lif veya protein ekle, yavaş yükselsin.",
      };
    }
  }

  // 3) IBS kullanıcısı — ad/ingredientte FODMAP tetikleyici arar
  if (healthModes.includes("ibs")) {
    const haystack = (product.name + " " + (product.ingredients || "")).toLowerCase();
    const fodmapTriggers = ["süt", "mercimek", "nohut", "soğan", "sarımsak", "buğday"];
    const hasTrigger = fodmapTriggers.some((t) => haystack.includes(t));
    if (hasTrigger) {
      return {
        level: "sari",
        icon: "🟡",
        message: "FODMAP tetikleyicisi olabilir",
        suggestion: "Küçük porsiyon dene, semptom kaydet.",
      };
    }
  }

  // 4) Hamilelik — cıva riski
  if (healthModes.includes("hamilelik")) {
    const name = product.name.toLowerCase();
    if (name.includes("ton") || name.includes("kılıç")) {
      return {
        level: "turuncu",
        icon: "🟠",
        message: "Hamilelikte cıva riski",
        suggestion: "Haftada 170g az cıvalı balıkla sınırla (somon, alabalık).",
      };
    }
  }

  // 5) PCOS — yüksek şeker+karbonhidrat kombini
  if (healthModes.includes("pcos")) {
    if (sugar > 20) {
      return {
        level: "sari",
        icon: "🟡",
        message: "İnsülin tepkisi yüksek olabilir",
        suggestion: "Protein ve tarçın/magnezyumla dengele.",
      };
    }
  }

  // Genel aşırılık uyarısı (sağlık modu aktif ama özel eşlenme yok)
  if (sugar > 25 || satFat > 10 || sodium > 800) {
    return {
      level: "sari",
      icon: "🟡",
      message: "Dengeli tüket",
      suggestion: "Tek başına değil, dengeli öğün içinde daha iyi.",
    };
  }

  // Temiz
  return {
    level: "yesil",
    icon: "🟢",
    message: "Senin için uygun görünüyor",
  };
}
