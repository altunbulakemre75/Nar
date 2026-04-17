import type { Goal, Nutrition, Product } from "@/types/database";

/**
 * Bir ürünün kullanıcının hedefine göre 0-100 skorunu hesaplar.
 * Nutri-Score mantığı + katkı maddesi cezası + hedef çarpanları.
 *
 * NOT: Bu MVP algoritması. Gerçek üründe diyetisyen ile incelenmeli.
 */
export function calculateScore(product: Product, goal: Goal): number {
  const n = product.nutrition;
  if (!n) return 50; // veri yoksa nötr

  let score = 50;

  // --- Olumlu besinler (+puan) ---
  if (n.fiber >= 3) score += 10;
  else if (n.fiber >= 1.5) score += 5;

  if (n.protein >= 10) score += 10;
  else if (n.protein >= 5) score += 5;

  // --- Olumsuz besinler (-puan) ---
  if (n.sugar >= 20) score -= 20;
  else if (n.sugar >= 10) score -= 10;
  else if (n.sugar >= 5) score -= 5;

  if (n.saturated_fat >= 5) score -= 10;
  else if (n.saturated_fat >= 2) score -= 5;

  if (n.sodium >= 600) score -= 10;
  else if (n.sodium >= 300) score -= 5;

  // --- Katkı maddeleri cezası ---
  const problematicAdditives = [
    "palm yağı",
    "yapay aroma",
    "sodyum nitrit",
    "E250",
    "E621", // MSG
    "aspartam",
    "E129", // Allura Red
  ];
  const additivePenalty = product.additives.filter((a) =>
    problematicAdditives.some((p) => a.toLowerCase().includes(p.toLowerCase()))
  ).length;
  score -= additivePenalty * 5;

  // --- Organik bonus ---
  if (product.is_organic) score += 5;

  // --- Hedef bazlı çarpan ---
  score = applyGoalModifier(score, n, goal);

  // 0-100 arasına sıkıştır
  return Math.max(0, Math.min(100, Math.round(score)));
}

function applyGoalModifier(score: number, n: Nutrition, goal: Goal): number {
  switch (goal) {
    case "lose_weight":
      if (n.calories > 200) score -= 5;
      if (n.sugar >= 15) score -= 5;
      return score;

    case "gain_muscle":
      if (n.protein >= 15) score += 10;
      if (n.protein >= 20) score += 5;
      return score;

    case "clear_skin":
      if (n.sugar >= 10) score -= 5;
      return score;

    case "reduce_bloat":
      if (n.sodium >= 400) score -= 10;
      return score;

    case "better_sleep":
      if (n.sugar >= 15) score -= 5;
      return score;

    case "more_energy":
      if (n.protein >= 10 && n.fiber >= 3) score += 5;
      return score;

    case "face_sculpt":
      if (n.sodium >= 400) score -= 5;
      return score;

    default:
      return score;
  }
}

export interface ScoreExplanation {
  points: number;
  label: string;
  type: "positive" | "negative" | "neutral";
}

export function explainScore(product: Product, goal: Goal): ScoreExplanation[] {
  const n = product.nutrition;
  if (!n) return [{ points: 0, label: "Besin değeri verisi yok", type: "neutral" }];

  const reasons: ScoreExplanation[] = [];

  if (n.fiber >= 3) reasons.push({ points: 10, label: `Yüksek lif (${n.fiber}g)`, type: "positive" });
  if (n.protein >= 10) reasons.push({ points: 10, label: `İyi protein kaynağı (${n.protein}g)`, type: "positive" });
  if (product.is_organic) reasons.push({ points: 5, label: "Organik", type: "positive" });

  if (n.sugar >= 20) reasons.push({ points: -20, label: `Çok yüksek şeker (${n.sugar}g)`, type: "negative" });
  else if (n.sugar >= 10) reasons.push({ points: -10, label: `Yüksek şeker (${n.sugar}g)`, type: "negative" });

  if (n.saturated_fat >= 5) reasons.push({ points: -10, label: `Yüksek doymuş yağ (${n.saturated_fat}g)`, type: "negative" });

  if (n.sodium >= 600) reasons.push({ points: -10, label: `Çok yüksek sodyum (${n.sodium}mg)`, type: "negative" });
  else if (n.sodium >= 300) reasons.push({ points: -5, label: `Yüksek sodyum (${n.sodium}mg)`, type: "negative" });

  for (const additive of product.additives) {
    reasons.push({ points: -5, label: `İçerik: ${additive}`, type: "negative" });
  }

  return reasons;
}
