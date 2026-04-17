import type { Goal, Nutrition, Product } from "@/types/database";

const PROBLEMATIC_ADDITIVES = [
  "palm yağı", "yapay aroma", "sodyum nitrit",
  "E250", "E621", "aspartam", "E129",
];

function findProblematicAdditives(additives: string[]): string[] {
  return additives.filter((a) =>
    PROBLEMATIC_ADDITIVES.some((p) => a.toLowerCase().includes(p.toLowerCase()))
  );
}

/**
 * 0-100 skor. Besin verisi yoksa -1 döner — UI '?' göstermeli.
 * Kalibrasyon: doğal/az işlenmiş gıdalar 55-75 bandında, işlenmiş tatlılar 20-40.
 */
export function calculateScore(product: Product, goal: Goal): number {
  if (!product.nutrition || product.nutrition.calories === 0) return -1;

  const n = product.nutrition as Nutrition;
  let score = 50;

  // --- Pozitifler (kolay kazanılabilir) ---
  if (n.fiber >= 5) score += 12;
  else if (n.fiber >= 3) score += 8;
  else if (n.fiber >= 1.5) score += 4;

  if (n.protein >= 15) score += 15;
  else if (n.protein >= 8) score += 10;
  else if (n.protein >= 4) score += 6;
  else if (n.protein >= 2) score += 3;

  // Temiz etiket bonusu: sorunlu katkı yoksa + kısa içerik listesi
  const problematicCount = findProblematicAdditives(product.additives).length;
  if (problematicCount === 0) score += 5;
  if (product.additives.length <= 2) score += 5;

  if (product.is_organic) score += 5;

  // --- Negatifler (yumuşatıldı) ---
  if (n.sugar >= 25) score -= 15;
  else if (n.sugar >= 15) score -= 10;
  else if (n.sugar >= 8) score -= 5;

  // Doymuş yağ eşiği 2g → 5g (süt ürünleri haksız ceza almasın)
  if (n.saturated_fat >= 10) score -= 10;
  else if (n.saturated_fat >= 5) score -= 5;

  if (n.sodium >= 800) score -= 10;
  else if (n.sodium >= 400) score -= 5;

  score -= problematicCount * 5;

  score = applyGoalModifier(score, n, goal);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function applyGoalModifier(score: number, n: Nutrition, goal: Goal): number {
  switch (goal) {
    case "lose_weight":
      // 200 → 400 (doğal süt/yoğurt haksız ceza almasın)
      if (n.calories > 400) score -= 5;
      if (n.sugar >= 20) score -= 3;
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

