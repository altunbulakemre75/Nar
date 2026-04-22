import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { useFocusEffect, router } from "expo-router";
import { ScanLine, Flame, ChevronRight, Package, Trash2 } from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { getTodayLog, getRecentScans, deleteScan, type ScanWithProduct } from "@/lib/products";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { getStreakCount } from "@/lib/stats";
import { scoreColor, getScoreBgColor, getScoreBorderColor, getScoreTextColor } from "@/constants/colors";
import { GOAL_LABELS, type Goal } from "@/types/database";
import { AuraCard } from "@/components/AuraCard";
import { WaterCard } from "@/components/WaterCard";
import { MoodCard } from "@/components/MoodCard";

export default function Home() {
  const t = useT();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [todayScore, setTodayScore] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [recent, setRecent] = useState<ScanWithProduct[]>([]);
  const [hasEverScanned, setHasEverScanned] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;

    try {
      const [log, streakCount, recentScans, profileRes, countRes] =
        await Promise.all([
          getTodayLog(),
          getStreakCount(),
          getRecentScans(15),
          supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
          supabase
            .from("scans")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

      setTodayScore(log ? Math.round(Number(log.average_score)) : 0);
      setTodayCount(log?.items_count ?? 0);
      setStreak(streakCount);
      setRecent(recentScans);
      setGoal((profileRes.data?.goal as Goal) ?? null);
      setHasEverScanned((countRes.count ?? 0) > 0);
    } catch (e) {
      console.warn("home.fetchAll failed:", (e as Error).message);
    }
  }, [user]);

  // Tek kaynak: useFocusEffect mount + her focus'ta çalışır.
  // İlk mount'ta loading'i kapatmak için ref-li kilit.
  const firstLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      fetchAll().finally(() => {
        if (!firstLoadedRef.current) {
          firstLoadedRef.current = true;
          setLoading(false);
        }
      });
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
        {/* Üst: Sadece logo */}
        <View className="px-4 pt-2 pb-3" style={{ borderBottomWidth: 0.5, borderBottomColor: "#EEE" }}>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "baseline", gap: 6 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay-BoldItalic",
                fontSize: 40,
                color: "#C73030",
                lineHeight: 48,
              }}
            >
              Nar
            </Text>
            <Text
              style={{
                fontFamily: "PlayfairDisplay-BoldItalic",
                fontSize: 22,
                color: "#C73030",
                opacity: 0.75,
                letterSpacing: 1,
              }}
            >
              Aura
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="px-4"><Skeleton /></View>
        ) : (
          <>
            {/* Skor kartı */}
            <ScoreCard
              t={t}
              score={todayScore}
              itemsCount={todayCount}
              streak={streak}
              goal={goal}
              empty={!hasEverScanned}
            />

            {/* Aura'ya Sor kartı */}
            <AuraCard />

            {/* Su takibi */}
            <WaterCard />

            {/* Ruh hali takibi */}
            <MoodCard />

            {/* Büyük tara butonu — her zaman göster */}
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              style={{
                marginHorizontal: 16,
                marginTop: 28,
                height: 60,
                backgroundColor: "#111",
                borderRadius: 30,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ScanLine color="#fff" size={20} strokeWidth={2} />
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>
                {hasEverScanned ? t("home.scanButton") : t("home.firstScanButton")}
              </Text>
            </Pressable>

            {/* Son taramalar — dikey liste */}
            {recent.length > 0 && (
              <View style={{ marginTop: 28 }}>
                <Text style={{ paddingHorizontal: 16, paddingBottom: 12, fontSize: 22, fontWeight: "700", color: "#111" }}>
                  {t("home.recent")}
                </Text>
                <View style={{ paddingHorizontal: 16, gap: 10 }}>
                  {recent.map((s) => (
                    <RecentCard
                      key={s.id}
                      scan={s}
                      onDeleted={async () => {
                        const ok = await deleteScan(s.id);
                        if (ok) {
                          track("scan_deleted", { score: s.score, product_id: s.product.id });
                          await fetchAll();
                        } else {
                          Alert.alert("Silinemedi", "Tekrar dene.");
                        }
                      }}
                    />
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
  t,
  score,
  itemsCount,
  streak,
  goal,
  empty,
}: {
  t: (k: string, vars?: Record<string, string | number>) => string;
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
      className="mx-4 rounded-3xl border"
      style={{ backgroundColor: bg, borderColor: border, padding: 22 }}
    >
      <View className="flex-row items-center">
        <Text style={{ fontSize: 72, fontWeight: "700", color, lineHeight: 76 }}>
          {displayScore}
        </Text>
        <View className="ml-5 flex-1">
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>
            {t("home.todayScore")}
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
            {empty
              ? t("home.firstScan")
              : itemsCount > 0
              ? t("home.itemsScanned", { count: itemsCount })
              : t("home.noScansToday")}
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
            {t("home.unhealthy")}
          </Text>
          <Text className="text-xs" style={{ color: neutral ? "#AAA" : "#8B4848" }}>
            {t("home.perfect")}
          </Text>
        </View>
      </View>
    </View>
  );
}


function RecentCard({
  scan,
  onDeleted,
}: {
  scan: ScanWithProduct;
  onDeleted?: () => void;
}) {
  const tFn = useT();
  const [imgFailed, setImgFailed] = useState(false);
  const ringColor = getScoreBorderColor(scan.score);

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        Alert.alert(tFn("home.deleteTitle"), tFn("home.deleteBody"), [
          { text: tFn("common.cancel"), style: "cancel" },
          { text: tFn("home.deleteTitle"), style: "destructive", onPress: () => onDeleted?.() },
        ]);
      }}
      style={{
        width: 80,
        backgroundColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        marginLeft: 8,
      }}
    >
      <Trash2 size={24} color="#FFF" strokeWidth={2} />
    </Pressable>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
    <Pressable
      onPress={() =>
        router.push({ pathname: "/scan-result", params: { barcode: scan.product.barcode } })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#FFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 12,
          backgroundColor: "#FFF",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 6,
        }}
      >
        {scan.product.image_url && !imgFailed ? (
          <Image
            source={{ uri: scan.product.image_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Package size={28} color="#C73030" strokeWidth={1.5} />
        )}
      </View>
      <View style={{ marginLeft: 14, flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }} numberOfLines={1}>
          {scan.product.name}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }} numberOfLines={1}>
          {scan.product.brand ?? "—"}
        </Text>
        <View style={{ marginTop: 8, flexDirection: "row" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: getScoreBgColor(scan.score),
              borderWidth: 1,
              borderColor: ringColor,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 14,
            }}
          >
            {/* Küçük renkli skor halkası */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: ringColor,
                borderTopColor: "transparent",
                marginRight: 6,
                transform: [{ rotate: "-45deg" }],
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: "700", color: getScoreTextColor(scan.score) }}>
              {tFn("home.score")}: {scan.score}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#999" strokeWidth={2} />
    </Pressable>
    </Swipeable>
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
