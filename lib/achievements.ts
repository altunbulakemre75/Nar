import { supabase } from "./supabase";
import { ACHIEVEMENTS, type Achievement } from "@/types/achievements";
import { getStreakCount } from "./stats";

/**
 * Kullanıcının açtığı tüm rozetleri çek
 */
export async function getUnlockedAchievements(): Promise<string[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("getUnlockedAchievements:", error);
    return [];
  }
  return (data ?? []).map((r: any) => r.achievement_id);
}

/**
 * Tarama sonrası çağrılır. Yeni kazanılan rozetleri döndürür.
 */
export async function checkAchievements(): Promise<Achievement[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const unlocked = new Set(await getUnlockedAchievements());
  const newlyUnlocked: Achievement[] = [];

  // Scans veri çek
  const { data: scans } = await supabase
    .from("scans")
    .select("score, scanned_at, product_id, product:products(category)")
    .eq("user_id", user.id);

  const scanList = scans ?? [];
  const totalScans = scanList.length;

  const helpers = {
    first_scan: () => totalScans >= 1,
    scan_100: () => totalScans >= 100,
    score_80: () => scanList.some((s: any) => s.score >= 80),
    variety: () => {
      const cats = new Set(scanList.map((s: any) => s.product?.category).filter(Boolean));
      return cats.size >= 10;
    },
    night_owl: () => {
      const count = scanList.filter((s: any) => {
        const h = new Date(s.scanned_at).getHours();
        return h >= 22 || h < 2;
      }).length;
      return count >= 5;
    },
    early_bird: () => {
      const count = scanList.filter((s: any) => {
        const h = new Date(s.scanned_at).getHours();
        return h >= 6 && h < 8;
      }).length;
      return count >= 5;
    },
    goal_crusher: () => {
      const count = scanList.filter((s: any) => s.score >= 65).length;
      return count >= 50;
    },
  };

  // Streak kontrolü (ayrı query)
  const streak = await getStreakCount();

  const streakHelpers = {
    streak_7: streak >= 7,
    streak_30: streak >= 30,
  };

  // Ramazan kontrolü - PASIF. Ramazan modu kapalı olduğu için
  // ramadan_champ başarımı kazanılamaz. Açmak için lib/narci.ts
  // isRamadanNow() fonksiyonunu aktifleştir.
  const ramadanHelpers = {
    ramadan_champ: false,
  };

  // Hepsini kontrol et
  const allChecks: Record<string, boolean> = {
    ...Object.fromEntries(
      Object.entries(helpers).map(([k, fn]) => [k, fn()])
    ),
    ...streakHelpers,
    ...ramadanHelpers,
  };

  const toInsert: { user_id: string; achievement_id: string }[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    if (allChecks[achievement.id]) {
      toInsert.push({ user_id: user.id, achievement_id: achievement.id });
      newlyUnlocked.push(achievement);
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("user_achievements")
      .insert(toInsert);
    if (error) console.error("user_achievements.insert:", error);
  }

  return newlyUnlocked;
}
