import { View, Text } from "react-native";
import { useMoodStore, MOOD_EMOJIS, type Mood } from "@/lib/moodStore";

const MOOD_VALUES: Record<Mood, number> = {
  great: 5,
  good: 4,
  ok: 3,
  low: 2,
  tired: 1,
};

const MOOD_COLORS: Record<Mood, string> = {
  great: "#10B981",
  good: "#22C55E",
  ok: "#EAB308",
  low: "#F97316",
  tired: "#EF4444",
};

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

const WEEKDAYS_TR = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

export function MoodTrend() {
  const history = useMoodStore((s) => s.history);
  const days = lastNDays(7);
  const hasAny = days.some((d) => history[d]);

  if (!hasAny) {
    return null;
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "600", color: "#111", marginBottom: 14 }}>
        Ruh hali trendi · son 7 gün
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 }}>
        {days.map((date) => {
          const mood = history[date];
          const value = mood ? MOOD_VALUES[mood] : 0;
          const height = value === 0 ? 4 : (value / 5) * 70;
          const color = mood ? MOOD_COLORS[mood] : "#E5E7EB";
          const d = new Date(date);
          const dayLabel = WEEKDAYS_TR[d.getDay()];

          return (
            <View key={date} style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 14, marginBottom: 4 }}>
                {mood ? MOOD_EMOJIS[mood] : ""}
              </Text>
              <View
                style={{
                  width: 16,
                  height,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
              <Text style={{ fontSize: 10, color: "#888", marginTop: 6 }}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
