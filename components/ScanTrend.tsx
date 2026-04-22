import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/authStore";

interface DayStat {
  date: string;
  avg: number;
  count: number;
}

const WEEKDAYS_TR = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return out;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 50) return "#EAB308";
  if (score > 0) return "#F97316";
  return "#E5E7EB";
}

export function ScanTrend() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const days = lastNDays(7);
      const start = days[0];
      const { data } = await supabase
        .from("daily_logs")
        .select("date, average_score, items_count")
        .eq("user_id", user.id)
        .gte("date", start);

      if (!mounted) return;
      const byDate: Record<string, DayStat> = {};
      for (const d of days) byDate[d] = { date: d, avg: 0, count: 0 };
      (data ?? []).forEach((row: any) => {
        if (byDate[row.date]) {
          byDate[row.date] = {
            date: row.date,
            avg: Number(row.average_score ?? 0),
            count: row.items_count ?? 0,
          };
        }
      });
      setStats(days.map((d) => byDate[d]));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) return null;
  const hasAny = stats.some((s) => s.count > 0);
  if (!hasAny) return null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#111", marginBottom: 10 }}>
        Tarama trendi · 7 gün
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 54 }}>
        {stats.map((s) => {
          const height = s.avg > 0 ? (s.avg / 100) * 44 : 3;
          const color = scoreColor(s.avg);
          const d = new Date(s.date);
          const dayLabel = WEEKDAYS_TR[d.getDay()];

          return (
            <View key={s.date} style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 9, color: "#111", marginBottom: 2, fontWeight: "600" }}>
                {s.count > 0 ? Math.round(s.avg) : ""}
              </Text>
              <View
                style={{
                  width: 12,
                  height,
                  borderRadius: 3,
                  backgroundColor: color,
                }}
              />
              <Text style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
