import { format, startOfDay, subDays, differenceInCalendarDays } from "date-fns";
import { supabase } from "./supabase";

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export async function getStreakCount(): Promise<number> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return 0;

  const today = startOfDay(new Date());
  const start = fmt(subDays(today, 60)); // son 60 gün bak

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("date, items_count")
    .eq("user_id", user.id)
    .gte("date", start)
    .gt("items_count", 0)
    .order("date", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  // Bugünden geriye doğru ard arda olan gün sayısı
  let streak = 0;
  let cursor = today;

  // Bugün tarama yoksa dünden başla
  const todayKey = fmt(today);
  const hasToday = logs.some((l: any) => l.date === todayKey);
  if (!hasToday) {
    cursor = subDays(today, 1);
  }

  for (const log of logs as any[]) {
    const diff = differenceInCalendarDays(cursor, new Date(log.date));
    if (diff === 0) {
      streak++;
      cursor = subDays(cursor, 1);
    } else if (diff < 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}


// ===============================
// Takvim ve istatistik fonksiyonları
// ===============================

export interface DayData {
  date: string;             // YYYY-MM-DD
  average_score: number;
  items_count: number;
}

export async function getCalendarData(
  months = 3
): Promise<Record<string, DayData>> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return {};

  const today = startOfDay(new Date());
  const start = fmt(subDays(today, months * 31));

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("date, average_score, items_count")
    .eq("user_id", user.id)
    .gte("date", start)
    .order("date", { ascending: false });

  const map: Record<string, DayData> = {};
  (logs ?? []).forEach((l: any) => {
    map[l.date] = {
      date: l.date,
      average_score: Number(l.average_score ?? 0),
      items_count: l.items_count ?? 0,
    };
  });
  return map;
}

export interface ScanOnDate {
  id: string;
  score: number;
  scanned_at: string;
  product: {
    id: number;
    name: string;
    brand: string | null;
    category: string | null;
    barcode: string;
  };
}

export async function getScansByDate(date: string): Promise<ScanOnDate[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("scans")
    .select("id, score, scanned_at, product:products(id, name, brand, category, barcode)")
    .eq("user_id", user.id)
    .gte("scanned_at", `${date}T00:00:00`)
    .lte("scanned_at", `${date}T23:59:59`)
    .order("scanned_at", { ascending: false });

  if (error) {
    console.error("getScansByDate:", error);
    return [];
  }
  return (data as unknown as ScanOnDate[]) ?? [];
}

export interface ProfileSummary {
  totalScans: number;
  averageScore: number;
  currentStreak: number;
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { totalScans: 0, averageScore: 0, currentStreak: 0 };

  const [scansRes, streak] = await Promise.all([
    supabase.from("scans").select("score").eq("user_id", user.id),
    getStreakCount(),
  ]);

  const scans = scansRes.data ?? [];
  const totalScans = scans.length;
  const averageScore =
    totalScans > 0
      ? Math.round(scans.reduce((s: number, x: any) => s + (x.score ?? 0), 0) / totalScans)
      : 0;

  return { totalScans, averageScore, currentStreak: streak };
}
