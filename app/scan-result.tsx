import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import {
  ChevronLeft,
  Heart,
  AlertTriangle,
  Package,
  Flame,
  Droplet,
  Cookie,
  Wheat,
  Beef,
  Soup,
  MessageCircle,
  Check,
  Info,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getProductByBarcode, saveScan } from "@/lib/products";
import { calculateScore } from "@/lib/scoring";
import {
  getScoreBgColor,
  getScoreBorderColor,
  getScoreTextColor,
  scoreLabel,
} from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import type { Product, Goal, Nutrition, Profile } from "@/types/database";
import { checkAchievements } from "@/lib/achievements";
import { track, reportError } from "@/lib/analytics";
import { useFavoritesStore } from "@/lib/favorites";
import { analyzeBasiret } from "@/lib/basiret";
import { BasiretCard } from "@/components/BasiretCard";

const SUGGESTED_QUESTIONS = [
  "Bu ürün şişkinlik yapar mı?",
  "Alternatif öner",
  "Bu sağlıklı mı?",
];

export default function ScanResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [goal, setGoal] = useState<Goal>("lose_weight");
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [score, setScore] = useState(-1);
  const [saving, setSaving] = useState(false);

  // Unmount sonrası setState'i engelle
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!barcode) return;
      try {
        const user = (await supabase.auth.getUser()).data.user;
        let userGoal: Goal = "lose_weight";
        let userProfile: Partial<Profile> | null = null;
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("goal, health_modes, narci_personality")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.goal) userGoal = prof.goal as Goal;
          userProfile = prof ?? null;
        }
        if (!mountedRef.current) return;
        setGoal(userGoal);
        setProfile(userProfile);

        const p = await getProductByBarcode(barcode);
        if (!mountedRef.current) return;
        if (!p) {
          router.replace({ pathname: "/scan-not-found", params: { barcode } });
          return;
        }

        const s = calculateScore(p, userGoal);
        track("product_scanned", {
          barcode,
          name: p.name,
          brand: p.brand ?? null,
          score: s,
          has_data: s >= 0,
          has_complete_data: p.has_complete_data ?? false,
          goal: userGoal,
          sold_in_turkey: p.sold_in_turkey ?? false,
        });
        setProduct(p);
        setScore(s);
      } catch (e) {
        reportError(e, { where: "scan-result.load", barcode });
        Alert.alert("Hata", "Ürün yüklenemedi. Tekrar dene.");
        router.back();
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [barcode]);

  const handleAddToDay = async () => {
    if (!product) return;
    if (score < 0) {
      Alert.alert("Eklenemez", "Bu ürünün besin değerleri eksik.");
      return;
    }
    setSaving(true);
    const savedScore = await saveScan(product, goal);
    if (!mountedRef.current) return;
    if (savedScore === null) {
      setSaving(false);
      Alert.alert("Hata", "Kaydedilemedi. Tekrar dene.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    track("scan_added_to_day", {
      barcode: product.barcode,
      score: savedScore,
      goal,
    });
    let newlyUnlocked: Awaited<ReturnType<typeof checkAchievements>> = [];
    try {
      newlyUnlocked = await checkAchievements();
    } catch (e) {
      console.warn("checkAchievements failed:", (e as Error).message);
    }
    if (!mountedRef.current) return;
    setSaving(false);
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((a) =>
        track("achievement_unlocked", { id: a.id, title: a.title })
      );
      const first = newlyUnlocked[0];
      Alert.alert(
        `${first.icon}  Yeni rozet!`,
        `${first.title}\n\n${first.description}`,
        [{ text: "Harika!", onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  };

  // HER render'da aynı sırada çağrılması gereken hook'lar — erken return'DAN ÖNCE
  const favBarcodes = useFavoritesStore((s) => s.barcodes);
  const n: Nutrition | null = product?.nutrition ?? null;
  const goodItems = useMemo(() => buildGoodItems(n), [n]);
  const warnItems = useMemo(() => buildWarnItems(n, goal), [n, goal]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#C73030" size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!product) return null;

  const isFav = favBarcodes.includes(product.barcode);
  const hasData = score >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={{ fontFamily: "PlayfairDisplay-BoldItalic", fontSize: 40, lineHeight: 48, color: "#C73030" }}>
            Nar
          </Text>
          <Text style={{ fontFamily: "PlayfairDisplay-BoldItalic", fontSize: 22, color: "#C73030", opacity: 0.75, letterSpacing: 1 }}>
            Aura
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (!product) return;
            const added = useFavoritesStore.getState().toggle(product.barcode);
            if (added) Haptics.selectionAsync();
            track(added ? "favorite_added" : "favorite_removed", { barcode: product.barcode });
          }}
          hitSlop={10}
        >
          <Heart
            size={24}
            color={isFav ? "#C73030" : "#111"}
            fill={isFav ? "#C73030" : "transparent"}
            strokeWidth={2}
          />
        </Pressable>
      </View>
      <View style={{ height: 1, backgroundColor: "#EEE", marginHorizontal: 16 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Ürün başlığı */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 }}>
          <ProductImage imageUrl={product.image_url} size={96} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111", lineHeight: 26 }} numberOfLines={2}>
              {product.name}
            </Text>
            {product.brand ? (
              <Text style={{ fontSize: 15, color: "#666", marginTop: 2 }}>{product.brand}</Text>
            ) : null}
            <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
              Porsiyon: {n?.serving_size_g ?? 100}g
            </Text>
          </View>
        </View>

        {/* Eksik veri uyarısı */}
        {!product.has_complete_data && hasData && (
          <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B" }}>
            <AlertTriangle size={16} color="#92400E" />
            <Text style={{ marginLeft: 8, fontSize: 12, flex: 1, color: "#92400E", lineHeight: 17 }}>
              Besin verisi eksik olabilir, skor tahminidir.
            </Text>
          </View>
        )}

        {/* Skor kartı — dairesel */}
        <View
          style={{
            marginHorizontal: 16,
            padding: 18,
            borderRadius: 18,
            backgroundColor: getScoreBgColor(score),
            borderWidth: 1.5,
            borderColor: getScoreBorderColor(score),
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <ScoreRing score={score} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111" }}>
              {hasData ? `${goalShortLabel(goal)} Skoru` : "Skor yok"}
            </Text>
            <Text style={{ fontSize: 13, color: getScoreTextColor(score), marginTop: 2, fontWeight: "600" }}>
              {hasData ? scoreLabel(score) : "Veri yetersiz"}
            </Text>
          </View>
        </View>

        {/* Açıklama info kutusu */}
        {hasData && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: getScoreBgColor(score),
              borderWidth: 1,
              borderColor: getScoreBorderColor(score),
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: getScoreBorderColor(score), alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <Info size={13} color="#FFF" strokeWidth={2.5} />
            </View>
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: "#111", lineHeight: 19 }}>
              {buildHeadline(score, warnItems, goodItems, goal)}
            </Text>
          </View>
        )}

        {/* Basiret — yemekten önce sağlık modu tabanlı karar */}
        {product && profile && (() => {
          const basiret = analyzeBasiret(product, profile);
          return basiret ? <BasiretCard result={basiret} /> : null;
        })()}

        {/* İyi Dengelenmiş */}
        {goodItems.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 22, marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>İyi Dengelenmiş</Text>
              <Text style={{ fontSize: 11, color: "#999" }}>Porsiyon (100g)</Text>
            </View>
            <View style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: "#F7F7F8", overflow: "hidden" }}>
              {goodItems.map((it, i) => (
                <NutrientRow key={it.key} item={it} last={i === goodItems.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* Dikkat Edilmeli */}
        {warnItems.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", paddingHorizontal: 16, marginTop: 22, marginBottom: 8 }}>
              Dikkat Edilmeli
            </Text>
            <View style={{ marginHorizontal: 16, borderRadius: 16, backgroundColor: "#F7F7F8", overflow: "hidden" }}>
              {warnItems.map((it, i) => (
                <NutrientRow key={it.key} item={it} last={i === warnItems.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* Aura soruları */}
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", paddingHorizontal: 16, marginTop: 24, marginBottom: 10 }}>
          Aura'ya Sor
        </Text>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() =>
                router.push({
                  pathname: "/narci",
                  params: { productId: product.barcode, prompt: q },
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#FFF",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <MessageCircle size={18} color="#111" strokeWidth={1.8} />
                <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: "600", color: "#111" }}>
                  {q}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: "#111" }}>→</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Alt sticky buton */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 24,
          backgroundColor: "rgba(255,253,251,0.97)",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        }}
      >
        <Pressable
          onPress={handleAddToDay}
          disabled={saving || !hasData}
          style={{
            height: 54,
            borderRadius: 27,
            backgroundColor: hasData ? "#111" : "#CCC",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: saving || !hasData ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>
            {saving ? "Kaydediliyor..." : "Güne ekle"}
          </Text>
          {!saving && hasData && <Check size={18} color="#FFF" strokeWidth={2.5} />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* --- Yardımcılar --- */

type DotColor = "green" | "yellow" | "red";

interface NutrientItem {
  key: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  value: string;
  dot: DotColor;
}

function buildGoodItems(n: Nutrition | null): NutrientItem[] {
  if (!n || n.calories === 0) return [];
  const items: NutrientItem[] = [];
  if (n.fiber > 0) {
    items.push({
      key: "fiber",
      icon: <Wheat size={20} color="#111" strokeWidth={1.8} />,
      name: "Lif",
      description:
        n.fiber >= 3 ? "Yüksek lif kaynağı" : n.fiber >= 1.5 ? "Orta düzeyde lif" : "Az miktarda lif",
      value: `${n.fiber}g`,
      dot: n.fiber >= 3 ? "green" : n.fiber >= 1.5 ? "green" : "yellow",
    });
  }
  if (n.protein > 0) {
    items.push({
      key: "protein",
      icon: <Beef size={20} color="#111" strokeWidth={1.8} />,
      name: "Protein",
      description:
        n.protein >= 10 ? "İyi protein kaynağı" : n.protein >= 5 ? "Orta düzeyde protein" : "Az miktarda protein",
      value: `${n.protein}g`,
      dot: n.protein >= 10 ? "green" : n.protein >= 5 ? "green" : "yellow",
    });
  }
  return items;
}

function buildWarnItems(n: Nutrition | null, goal: Goal): NutrientItem[] {
  if (!n || n.calories === 0) return [];
  const items: NutrientItem[] = [];

  if (n.calories > 0) {
    const high = goal === "lose_weight" ? n.calories > 250 : n.calories > 400;
    items.push({
      key: "calories",
      icon: <Flame size={20} color="#111" strokeWidth={1.8} />,
      name: "Kalori",
      description: high
        ? goal === "lose_weight"
          ? "Kilo verme hedefin için yüksek"
          : "Yüksek kalori yoğunluğu"
        : "Kabul edilebilir seviyede",
      value: `${n.calories} kcal`,
      dot: high ? "yellow" : "green",
    });
  }

  if (n.saturated_fat >= 2) {
    items.push({
      key: "sat_fat",
      icon: <Droplet size={20} color="#111" strokeWidth={1.8} />,
      name: "Doymuş yağ",
      description:
        n.saturated_fat >= 5
          ? "Yüksek doymuş yağ, kalp sağlığı için dikkat"
          : "Orta düzeyde doymuş yağ",
      value: `${n.saturated_fat}g`,
      dot: n.saturated_fat >= 5 ? "red" : "yellow",
    });
  }

  if (n.sodium >= 300) {
    items.push({
      key: "sodium",
      icon: <Soup size={20} color="#111" strokeWidth={1.8} />,
      name: "Sodyum",
      description:
        n.sodium >= 600
          ? "Yüksek sodyum, şişkinlik yapabilir"
          : "Orta düzeyde sodyum",
      value: `${n.sodium}mg`,
      dot: n.sodium >= 600 ? "red" : "yellow",
    });
  }

  if (n.sugar >= 5) {
    const highSugarThreshold = goal === "lose_weight" || goal === "clear_skin" ? 10 : 15;
    items.push({
      key: "sugar",
      icon: <Cookie size={20} color="#111" strokeWidth={1.8} />,
      name: "Şeker",
      description:
        n.sugar >= highSugarThreshold
          ? goal === "lose_weight"
            ? "Kilo verme hedefin için yüksek şeker"
            : "Yüksek şeker"
          : "Orta düzeyde şeker",
      value: `${n.sugar}g`,
      dot: n.sugar >= highSugarThreshold ? "red" : "yellow",
    });
  }

  return items;
}

function buildHeadline(
  score: number,
  warns: NutrientItem[],
  goods: NutrientItem[],
  goal: Goal
): string {
  if (score >= 85) return "Bu ürün hedefinle çok uyumlu görünüyor.";
  if (score >= 65) return "Ölçülü tüketirsen hedefinle uyumlu.";
  const badNames = warns
    .filter((w) => w.dot === "red")
    .map((w) => w.name.toLowerCase());
  if (score < 40 && badNames.length > 0) {
    return `Yüksek ${badNames.slice(0, 2).join(" ve ")} içeriyor; ${goalShortLabel(goal).toLowerCase()} hedefin için uygun değil.`;
  }
  if (warns.length > 0) {
    return `${warns[0].name} değeri hedefinle uyumsuz — ölçülü tüketmeye dikkat et.`;
  }
  return "Ara sıra tüketilebilir.";
}

function goalShortLabel(goal: Goal): string {
  switch (goal) {
    case "lose_weight":
      return "Kilo";
    case "gain_muscle":
      return "Kas";
    case "clear_skin":
      return "Cilt";
    case "reduce_bloat":
      return "Sindirim";
    case "better_sleep":
      return "Uyku";
    case "more_energy":
      return "Enerji";
    case "face_sculpt":
      return "Yüz";
    default:
      return "Hedef";
  }
}

function ProductImage({ imageUrl, size = 80 }: { imageUrl: string | null | undefined; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#EEE",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 8,
      }}
    >
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={size * 0.4} color="#C73030" strokeWidth={1.5} />
      )}
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 88;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score < 0 ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);
  const ringColor = getScoreBorderColor(score);
  const trackColor = getScoreBgColor(score);
  const textColor = getScoreTextColor(score);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor === "#F3F4F6" ? "#E5E7EB" : trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: textColor, lineHeight: 30 }}>
          {score < 0 ? "?" : score}
        </Text>
      </View>
    </View>
  );
}

function NutrientRow({ item, last }: { item: NutrientItem; last: boolean }) {
  const dotColor =
    item.dot === "green" ? "#22C55E" : item.dot === "yellow" ? "#F5B100" : "#DC2626";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#ECECEE",
      }}
    >
      <View style={{ width: 36, alignItems: "center" }}>{item.icon}</View>
      <View style={{ flex: 1, marginLeft: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: "#666", marginTop: 2, lineHeight: 16 }}>
          {item.description}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#111", marginRight: 8 }}>
          {item.value}
        </Text>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
      </View>
    </View>
  );
}
