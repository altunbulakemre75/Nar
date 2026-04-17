import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, TrendingUp, TrendingDown, Award } from "lucide-react-native";
import { format, parseISO } from "date-fns";
import WeeklyChart from "@/components/WeeklyChart";
import { getWeeklyStats, type WeeklyStats } from "@/lib/stats";
import { getRecentScans, type ScanWithProduct } from "@/lib/products";
import { scoreColor } from "@/constants/colors";

export default function WeeklyStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [scans, setScans] = useState<ScanWithProduct[]>([]);

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([getWeeklyStats(), getRecentScans(30)]);
      setStats(s);
      // Sadece son 7 gün
      const weekStart = s.days[0]?.date;
      const filtered = weekStart
        ? r.filter((x) => x.scanned_at.slice(0, 10) >= weekStart)
        : r;
      setScans(filtered);
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#C73030" />
        </View>
      </SafeAreaView>
    );
  }

  // Taramaları günlere göre grupla
  const byDay: Record<string, ScanWithProduct[]> = {};
  scans.forEach((s) => {
    const key = s.scanned_at.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  });

  const sortedDays = Object.keys(byDay).sort((a, b) => (a > b ? -1 : 1));

  // Geliştirme önerileri (basit kural)
  const suggestions = buildSuggestions(stats);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <X size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>Haftalık özet</Text>
        <View className="w-9 h-9" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Ortalama skor kartı */}
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#FFF5F2", borderWidth: 1.5, borderColor: "#F5D4CA" }}
        >
          <Text style={{ fontSize: 12, color: "#8B4848", fontWeight: "500" }}>
            Son 7 gün ortalaması
          </Text>
          <View className="flex-row items-baseline mt-1">
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 56, color: "#C73030", lineHeight: 60 }}>
              {stats.averageScore > 0 ? stats.averageScore : "-"}
            </Text>
            {stats.averageScore > 0 ? (
              <Text style={{ fontSize: 18, color: "#6B1A1A", marginLeft: 4 }}>/100</Text>
            ) : null}
          </View>
          {stats.weekOverWeekChange !== 0 && (
            <View className="flex-row items-center mt-2">
              {stats.weekOverWeekChange > 0 ? (
                <TrendingUp size={14} color="#2D8A4E" strokeWidth={2} />
              ) : (
                <TrendingDown size={14} color="#C73030" strokeWidth={2} />
              )}
              <Text
                style={{
                  fontSize: 12,
                  marginLeft: 4,
                  color: stats.weekOverWeekChange > 0 ? "#2D8A4E" : "#C73030",
                  fontWeight: "600",
                }}
              >
                Geçen haftaya göre {stats.weekOverWeekChange > 0 ? "+" : ""}
                {stats.weekOverWeekChange} puan
              </Text>
            </View>
          )}
        </View>

        {/* Chart */}
        <View
          className="mt-3 rounded-2xl border p-4"
          style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 8 }}>
            Günlük skorlar
          </Text>
          <View style={{ alignItems: "center" }}>
            <WeeklyChart days={stats.days} height={140} />
          </View>
        </View>

        {/* En iyi gün */}
        {stats.bestDay && (
          <View
            className="mt-3 rounded-2xl border p-4 flex-row items-center"
            style={{ backgroundColor: "#F0FFF4", borderColor: "#A5D65F" }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Award size={20} color="#2D8A4E" strokeWidth={2} />
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D6A3E" }}>
                En iyi günün
              </Text>
              <Text style={{ fontSize: 12, color: "#2D6A3E", marginTop: 2 }}>
                {format(parseISO(stats.bestDay.date), "dd MMM")} - ortalama {stats.bestDay.score}
              </Text>
            </View>
          </View>
        )}

        {/* ÖneriLer */}
        {suggestions.length > 0 && (
          <View
            className="mt-3 rounded-2xl border p-4"
            style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 10 }}>
              Geliştirme önerileri
            </Text>
            {suggestions.map((s, i) => (
              <View key={i} className="flex-row mb-2">
                <Text style={{ color: "#C73030", marginRight: 8 }}>•</Text>
                <Text style={{ flex: 1, fontSize: 13, color: "#444", lineHeight: 18 }}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bu hafta taradıkların */}
        {sortedDays.length > 0 && (
          <Text className="mt-6 mb-2 text-sm font-semibold" style={{ color: "#111" }}>
            Bu hafta taradıkların
          </Text>
        )}

        {sortedDays.map((day) => (
          <View key={day} className="mb-4">
            <Text className="text-xs font-medium mb-2" style={{ color: "#666" }}>
              {format(parseISO(day), "dd MMMM")} · {byDay[day].length} tarama
            </Text>
            {byDay[day].map((s) => (
              <View
                key={s.id}
                className="flex-row items-center rounded-2xl border p-3 mb-2"
                style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "#FFF5F2" }}
                >
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#111" }} numberOfLines={1}>
                    {s.product.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
                    {s.product.brand ?? "-"}
                  </Text>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: scoreColor(s.score) + "22" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: scoreColor(s.score) }}>
                    {s.score}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildSuggestions(stats: WeeklyStats): string[] {
  const s: string[] = [];
  if (stats.totalScans === 0) {
    s.push("Bu hafta hiç ürün taramadın — küçük adımlarla başla.");
    return s;
  }
  if (stats.averageScore < 40) {
    s.push("Ortalama skorun düşük. Daha az işlenmiş, düşük şekerli ürünler dene.");
  }
  if (stats.averageScore >= 40 && stats.averageScore < 65) {
    s.push("İyi gidiyorsun, lif ve protein açısından zengin seçenekleri artır.");
  }
  if (stats.totalScans < 7) {
    s.push("Haftada en az 7 tarama hedef — günde bir ürün yetişir.");
  }
  const activeDays = stats.days.filter((d) => d.count > 0).length;
  if (activeDays > 0 && activeDays < 4) {
    s.push(`Bu hafta sadece ${activeDays} gün tarama yaptın — daha düzenli olmayı dene.`);
  }
  return s;
}
