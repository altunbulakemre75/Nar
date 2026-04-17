import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
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
  ChevronRight,
  Package,
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
import { scoreColor, getScoreBgColor, getScoreBorderColor, getScoreTextColor } from "@/constants/colors";
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
  const [hasEverScanned, setHasEverScanned] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;

    const [log, weeklyData, streakCount, recentScans, profileRes, countRes] =
      await Promise.all([
        getTodayLog(),
        getWeeklyStats(),
        getStreakCount(),
        getRecentScans(5),
        supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
        supabase
          .from("scans")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

    setTodayScore(log ? Math.round(Number(log.average_score)) : 0);
    setTodayCount(log?.items_count ?? 0);
    setWeekly(weeklyData);
    setStreak(streakCount);
    setRecent(recentScans);
    setGoal((profileRes.data?.goal as Goal) ?? null);
    setHasEverScanned((countRes.count ?? 0) > 0);
  }, [user]);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

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
        ) : (
          <>
            {/* Skor kartı */}
            <ScoreCard
              score={todayScore}
              itemsCount={todayCount}
              streak={streak}
              goal={goal}
              empty={!hasEverScanned}
            />

            {/* 4 tile grid */}
            <Text className="px-4 pt-5 pb-2 text-sm font-medium text-gray-900">
              Bugün sana özel
            </Text>
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
                    ? `${weekly.weekOverWeekChange > 0 ? "↑" : "↓"} ${Math.abs(
                        weekly.weekOverWeekChange
                      )} puan`
                    : weekly?.averageScore
                    ? `Ort: ${weekly.averageScore}`
                    : "—"
                }
                onPress={() => router.push("/weekly-stats")}
              />
            </View>

            {/* Haftalık chart */}
            {weekly && weekly.totalScans > 0 && (
              <View
                className="mx-4 mt-5 p-4 rounded-2xl border"
                style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
              >
                <View className="flex-row items-baseline justify-between mb-2">
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }}>
                    Bu hafta
                  </Text>
                  <Text style={{ fontSize: 11, color: "#999" }}>
                    Ort: {weekly.averageScore} · {weekly.totalScans} tarama
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <WeeklyChart days={weekly.days} />
                </View>
              </View>
            )}

            {/* Büyük tara butonu — sadece hiç tarama yoksa görünsün */}
            {!hasEverScanned && (
              <Pressable
                onPress={() => router.push("/(tabs)/scan")}
                style={{
                  marginHorizontal: 16,
                  marginTop: 16,
                  height: 56,
                  backgroundColor: "#111",
                  borderRadius: 28,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <ScanLine color="#fff" size={20} strokeWidth={2} />
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>
                  İlk Ürününü Tara
                </Text>
              </Pressable>
            )}

            {/* Son taramalar — dikey liste */}
            {recent.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ paddingHorizontal: 16, paddingBottom: 8, fontSize: 14, fontWeight: "600", color: "#111" }}>
                  Son taradıkların
                </Text>
                <View style={{ paddingHorizontal: 16, gap: 8 }}>
                  {recent.map((s) => (
                    <RecentCard key={s.id} scan={s} />
                  ))}
                </View>
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
  empty,
}: {
  score: number;
  itemsCount: number;
  streak: number;
  goal: Goal | null;
  empty: boolean;
}) {
  const neutral = empty || itemsCount === 0;
  const displayScore = neutral ? 0 : score;
  const color = neutral ? "#999" : scoreColor(score);
  const bg = neutral ? "#FFF5F2" : getScoreBgColor(score);
  const border = neutral ? "#F5D4CA" : getScoreBorderColor(score);
  // Arrow position: clamp score% to [4%, 94%] so it stays inside bar
  const arrowLeft = neutral ? "50%" : `${Math.min(94, Math.max(4, score))}%`;

  return (
    <View
      className="mx-4 p-4 rounded-2xl border"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <View className="flex-row items-baseline">
        <Text style={{ fontSize: 56, fontWeight: "700", color, lineHeight: 60 }}>
          {displayScore}
        </Text>
        <View className="ml-4 flex-1">
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111" }}>
            Bugünün Skoru
          </Text>
          <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
            {empty
              ? "İlk ürününü tara"
              : itemsCount > 0
              ? `${itemsCount} ürün tarandı bugün`
              : "Bugün henüz tarama yok"}
          </Text>
        </View>
        {streak > 0 && !empty && (
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
      <View className="mt-5" style={{ position: "relative" }}>
        <Text
          style={{
            position: "absolute",
            top: -14,
            left: arrowLeft as any,
            marginLeft: -6,
            fontSize: 14,
            color: neutral ? "#999" : color,
            lineHeight: 14,
          }}
        >
          ▼
        </Text>
        <View style={{ flexDirection: "row", gap: 3, height: 6 }}>
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#EF5C4A" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#F5B947" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#F5B947" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#A5D65F" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#7ECC54" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#5FB847" }} />
          <View style={{ flex: 1, borderRadius: 3, backgroundColor: "#5FB847" }} />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs" style={{ color: neutral ? "#AAA" : "#8B4848" }}>
            sağlıksız
          </Text>
          <Text className="text-xs" style={{ color: neutral ? "#AAA" : "#8B4848" }}>
            mükemmel
          </Text>
        </View>
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
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/scan-result", params: { barcode: scan.product.barcode } })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      {scan.product.image_url && !imgFailed ? (
        <Image
          source={{ uri: scan.product.image_url }}
          style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: "#F5F5F5" }}
          resizeMode="contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center" }}>
          <Package size={24} color="#C73030" strokeWidth={1.5} />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }} numberOfLines={1}>
          {scan.product.name}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }} numberOfLines={1}>
          {scan.product.brand ?? "—"}
        </Text>
        <View style={{ marginTop: 6, flexDirection: "row" }}>
          <View style={{
            backgroundColor: getScoreBgColor(scan.score),
            borderWidth: 1,
            borderColor: getScoreBorderColor(scan.score),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
          }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: getScoreTextColor(scan.score) }}>
              Skor: {scan.score}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={18} color="#CCC" />
    </Pressable>
  );
}

function Skeleton() {
  return (
    <View>
      <View
        style={{ height: 120, borderRadius: 16, backgroundColor: "#EFEAE3", marginBottom: 12 }}
      />
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
