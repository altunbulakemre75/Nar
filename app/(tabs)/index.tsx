import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import {
  MessageCircle,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  ScanLine,
  Flame,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { getTodayLog, getRecentScans, type ScanWithProduct } from "@/lib/products";
import {
  getWeeklyStats,
  getStreakCount,
  getGreeting,
  type WeeklyStats,
} from "@/lib/stats";
import { scoreColor } from "@/constants/colors";
import WeeklyChart from "@/components/WeeklyChart";
import { GOAL_LABELS, type Goal } from "@/types/database";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const name = (user?.user_metadata as any)?.name ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [todayScore, setTodayScore] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [recent, setRecent] = useState<ScanWithProduct[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;

    const [log, weeklyData, streakCount, recentScans, profileRes] = await Promise.all([
      getTodayLog(),
      getWeeklyStats(),
      getStreakCount(),
      getRecentScans(5),
      supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
    ]);

    setTodayScore(log ? Math.round(Number(log.average_score)) : 0);
    setTodayCount(log?.items_count ?? 0);
    setWeekly(weeklyData);
    setStreak(streakCount);
    setRecent(recentScans);
    setGoal((profileRes.data?.goal as Goal) ?? null);
  }, [user]);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  // Sekmeye her dönüşünde yenile (tarama sonrası güncel veri)
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const isEmpty = !loading && todayCount === 0 && (weekly?.totalScans ?? 0) === 0;

  return (
    <SafeAreaView className="flex-1 bg-nar-cream" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C73030" />
        }
      >
        {/* Üst: Logo + selamlama */}
        <View className="px-4 pt-3 pb-4">
          <Text
            style={{
              fontFamily: "PlayfairDisplay-BoldItalic",
              fontSize: 28,
              color: "#C73030",
              textAlign: "center",
            }}
          >
            Nar
          </Text>
          {name ? (
            <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginTop: 2 }}>
              {getGreeting(name)}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View className="px-4"><Skeleton /></View>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Skor kartı */}
            <ScoreCard
              score={todayScore}
              itemsCount={todayCount}
              streak={streak}
              goal={goal}
            />

            {/* 4 tile grid */}
            <Text className="px-4 pt-5 pb-2 text-sm font-medium text-gray-900">Bugün sana özel</Text>
            <View className="px-4 flex-row flex-wrap" style={{ gap: 10 }}>
              <Tile
                icon={<MessageCircle size={22} color="#C73030" strokeWidth={1.8} />}
                title="Narcı'ya sor"
                subtitle="AI beslenme koçu"
                bg="#FFF5F2"
                onPress={() => router.push("/narci")}
              />
              <Tile
                icon={<ChefHat size={22} color="#111" strokeWidth={1.8} />}
                title="Tarif öner"
                subtitle="Dolabına göre"
              />
              <Tile
                icon={<ShoppingBag size={22} color="#111" strokeWidth={1.8} />}
                title="Alışveriş"
                subtitle={`${weekly?.days.reduce((s, d) => s + d.count, 0) ?? 0} tarama bu hafta`}
              />
              <Tile
                icon={<TrendingUp size={22} color="#0F6E56" strokeWidth={1.8} />}
                title="Haftalık"
                subtitle={
                  weekly && weekly.weekOverWeekChange !== 0
                    ? `${weekly.weekOverWeekChange > 0 ? "-" : "-"} ${Math.abs(weekly.weekOverWeekChange)} puan`
                    : weekly?.averageScore
                    ? `Ort: ${weekly.averageScore}`
                    : "-"
                }
                onPress={() => router.push("/weekly-stats")}
              />
            </View>

            {/* Haftalık chart */}
            {weekly && weekly.totalScans > 0 && (
              <View className="mx-4 mt-5 p-4 rounded-2xl border" style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}>
                <View className="flex-row items-baseline justify-between mb-2">
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }}>Bu hafta</Text>
                  <Text style={{ fontSize: 11, color: "#999" }}>
                    Ort: {weekly.averageScore} · {weekly.totalScans} tarama
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <WeeklyChart days={weekly.days} />
                </View>
              </View>
            )}

            {/* Büyük tara butonu */}
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              className="mx-4 mt-5 py-4 rounded-full flex-row items-center justify-center"
              style={{ backgroundColor: "#111" }}
            >
              <ScanLine color="#fff" size={18} strokeWidth={2} />
              <Text className="text-white font-medium ml-2 text-sm">
                Barkod veya yemek tara
              </Text>
            </Pressable>

            {/* Son taramalar */}
            {recent.length > 0 && (
              <View className="mt-6">
                <Text className="px-4 pb-2 text-sm font-medium text-gray-900">
                  Son taradıkların
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                >
                  {recent.map((s) => (
                    <RecentCard key={s.id} scan={s} />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreCard({
  score,
  itemsCount,
  streak,
  goal,
}: {
  score: number;
  itemsCount: number;
  streak: number;
  goal: Goal | null;
}) {
  const color = score > 0 ? scoreColor(score) : "#C73030";
  return (
    <View
      className="mx-4 p-4 rounded-2xl border"
      style={{ backgroundColor: "#FFF5F2", borderColor: "#F5D4CA" }}
    >
      <View className="flex-row items-baseline">
        <Text style={{ fontFamily: "Inter-Medium", fontSize: 48, color, lineHeight: 48 }}>
          {score > 0 ? score : "-"}
        </Text>
        <View className="ml-3 flex-1">
          <Text className="text-base font-medium" style={{ color: "#6B1A1A" }}>
            Bugünün skoru
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: "#8B4848" }}>
            {itemsCount > 0
              ? `${itemsCount} ürün tarandı · hedef: ${goal ? GOAL_LABELS[goal] : "-"}`
              : "İlk ürününü tara"}
          </Text>
        </View>
        {streak > 0 && (
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Flame size={14} color="#FF7A00" strokeWidth={2} fill="#FF7A00" />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#FF7A00", marginLeft: 4 }}>
              {streak}
            </Text>
          </View>
        )}
      </View>

      {/* Skor barı */}
      <View className="flex-row gap-1 mt-4">
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#EF5C4A" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#F5B947" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#F5B947" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#A5D65F" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#7ECC54" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#5FB847" }} />
        <View className="flex-1 h-1.5 rounded" style={{ backgroundColor: "#5FB847" }} />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs" style={{ color: "#8B4848" }}>sağlıksız</Text>
        <Text className="text-xs" style={{ color: "#8B4848" }}>mükemmel</Text>
      </View>
    </View>
  );
}

function Tile({
  icon,
  title,
  subtitle,
  bg = "#FFFFFF",
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bg?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-3 border border-gray-100"
      style={{ backgroundColor: bg, width: "48%" }}
    >
      <View className="mb-2">{icon}</View>
      <Text className="text-sm font-medium text-gray-900">{title}</Text>
      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function RecentCard({ scan }: { scan: ScanWithProduct }) {
  const color = scoreColor(scan.score);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/scan-result", params: { barcode: scan.product.barcode } })}
      className="rounded-2xl border p-3"
      style={{ backgroundColor: "#FFF", borderColor: "#EEE", width: 160 }}
    >
      <View
        className="w-14 h-14 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: "#FFF5F2" }}
      >
        <Text style={{ fontSize: 22 }}>📦</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#111" }} numberOfLines={1}>
        {scan.product.name}
      </Text>
      <Text style={{ fontSize: 11, color: "#666", marginTop: 1 }} numberOfLines={1}>
        {scan.product.brand ?? "-"}
      </Text>
      <View
        className="mt-2 px-2 py-0.5 rounded-full self-start"
        style={{ backgroundColor: color + "22" }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color }}>
          {scan.score}
        </Text>
      </View>
    </Pressable>
  );
}

function Skeleton() {
  return (
    <View>
      <View style={{ height: 120, borderRadius: 16, backgroundColor: "#EFEAE3", marginBottom: 12 }} />
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{ width: "48%", height: 90, borderRadius: 16, backgroundColor: "#EFEAE3" }}
          />
        ))}
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="px-6 pt-4 items-center">
      <Text
        style={{
          fontFamily: "PlayfairDisplay-BoldItalic",
          fontSize: 72,
          color: "#F5D4CA",
          marginTop: 24,
        }}
      >
        Nar
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#111", marginTop: 12, textAlign: "center" }}>
        Yolculuğuna başla
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#666",
          textAlign: "center",
          marginTop: 8,
          lineHeight: 20,
          paddingHorizontal: 12,
        }}
      >
        İlk ürününü tara, Nar sana özel skor hesaplasın ve{"\n"}2 hafta içinde sonuçları gör.
      </Text>

      <Pressable
        onPress={() => router.push("/(tabs)/scan")}
        className="mt-8 py-4 px-10 rounded-full flex-row items-center"
        style={{ backgroundColor: "#C73030" }}
      >
        <ScanLine color="#fff" size={18} strokeWidth={2} />
        <Text className="text-white font-semibold ml-2">İlk taramanı yap</Text>
      </Pressable>
    </View>
  );
}
