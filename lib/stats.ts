import { format, startOfDay, subDays, differenceInCalendarDays } from "date-fns";
import { supabase } from "./supabase";

export interface DayStat {
  date: string;        // YYYY-MM-DD
  dayLabel: string;    // Pzt, Sal...
  score: number;
  count: number;
}

export interface WeeklyStats {
  days: DayStat[];     // son 7 gün (eski - yeni)
  averageScore: number;
  totalScans: number;
  bestDay: DayStat | null;
  weekOverWeekChange: number;
}

const TR_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    return { days: [], averageScore: 0, totalScans: 0, bestDay: null, weekOverWeekChange: 0 };
  }

  const today = startOfDay(new Date());
  const weekStart = fmt(subDays(today, 6));           // son 7 gün
  const prevWeekStart = fmt(subDays(today, 13));      // önceki 7 gün
  const prevWeekEnd = fmt(subDays(today, 7));

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", prevWeekStart)
    .lte("date", fmt(today));

  const logMap = new Map<string, { average_score: number; items_count: number }>();
  (logs ?? []).forEach((l: any) => {
    logMap.set(l.date, { average_score: Number(l.average_score), items_count: l.items_count });
  });

  const days: DayStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const key = fmt(d);
    const log = logMap.get(key);
    days.push({
      date: key,
      dayLabel: TR_DAYS[d.getDay()],
      score: log ? Math.round(log.average_score) : 0,
      count: log?.items_count ?? 0,
    });
  }

  const activeDays = days.filter((d) => d.count > 0);
  const averageScore =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((s, d) => s + d.score, 0) / activeDays.length)
      : 0;
  const totalScans = days.reduce((s, d) => s + d.count, 0);
  const bestDay =
    activeDays.length > 0 ? [...activeDays].sort((a, b) => b.score - a.score)[0] : null;

  // Önceki hafta ortalaması
  const prevLogs = (logs ?? []).filter(
    (l: any) => l.date >= prevWeekStart && l.date < weekStart
  );
  const prevAvg =
    prevLogs.length > 0
      ? prevLogs.reduce((s, l) => s + Number(l.average_score), 0) / prevLogs.length
      : 0;
  const weekOverWeekChange = prevAvg > 0 ? Math.round(averageScore - prevAvg) : 0;

  return { days, averageScore, totalScans, bestDay, weekOverWeekChange };
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

export function getGreeting(name?: string | null): string {
  const h = new Date().getHours();
  const prefix =
    h >= 5 && h < 12 ? "Günaydın"
    : h >= 12 && h < 18 ? "İyi günler"
    : h >= 18 && h < 22 ? "İyi akşamlar"
    : "İyi geceler";
  return name ? `${prefix}, ${name}` : prefix;
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
