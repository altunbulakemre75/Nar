import { useEffect, useState } from "react";
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
import {
  X,
  Heart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Package,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getProductByBarcode, saveScan } from "@/lib/products";
import { calculateScore, explainScore, type ScoreExplanation } from "@/lib/scoring";
import {
  getScoreBgColor,
  getScoreBorderColor,
  getScoreTextColor,
  scoreLabel,
} from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import type { Product, Goal } from "@/types/database";
import { checkAchievements } from "@/lib/achievements";

export default function ScanResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [goal, setGoal] = useState<Goal>("lose_weight");
  const [score, setScore] = useState(-1);
  const [reasons, setReasons] = useState<ScoreExplanation[]>([]);
  const [showReasons, setShowReasons] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!barcode) return;

      const user = (await supabase.auth.getUser()).data.user;
      let userGoal: Goal = "lose_weight";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("goal")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.goal) userGoal = profile.goal as Goal;
      }
      setGoal(userGoal);

      const p = await getProductByBarcode(barcode);
      if (!p) {
        router.replace({ pathname: "/scan-not-found", params: { barcode } });
        return;
      }

      console.log("🔍 Product data:", JSON.stringify(p, null, 2));
      console.log("🔍 Nutrition:", p.nutrition);

      setProduct(p);
      setScore(calculateScore(p, userGoal));
      setReasons(explainScore(p, userGoal));
      setLoading(false);
    })();
  }, [barcode]);

  const handleAddToDay = async () => {
    if (!product) return;
    if (score < 0) {
      Alert.alert(
        "Eklenemez",
        "Bu ürünün besin değerleri eksik. Skor hesaplanamadığı için güne eklenemez."
      );
      return;
    }
    setSaving(true);
    const savedScore = await saveScan(product, goal);
    if (savedScore === null) {
      setSaving(false);
      Alert.alert("Hata", "Kaydedilemedi. Tekrar dene.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let newlyUnlocked: Awaited<ReturnType<typeof checkAchievements>> = [];
    try {
      newlyUnlocked = await checkAchievements();
    } catch (e) {
      console.warn("checkAchievements failed:", (e as Error).message);
    }
    setSaving(false);
    if (newlyUnlocked.length > 0) {
      const first = newlyUnlocked[0];
      Alert.alert(
        `${first.icon}  Yeni rozet!`,
        `${first.title}\n\n${first.description}${
          newlyUnlocked.length > 1 ? `\n\n+${newlyUnlocked.length - 1} rozet daha kazandın!` : ""
        }`,
        [{ text: "Harika!", onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#C73030" size="large" />
          <Text style={{ marginTop: 16, fontSize: 13, color: "#666" }}>Ürün bulunuyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const hasData = score >= 0;
  const scoreDisplay = hasData ? score.toString() : "?";
  const scoreLabelText = hasData
    ? scoreLabel(score)
    : "Veri yetersiz — skor hesaplanamadı";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X size={24} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#111" }}>Tarama Sonucu</Text>
        <Pressable hitSlop={10}>
          <Heart size={22} color="#111" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ürün görseli */}
        <View style={{ alignItems: "center", paddingVertical: 24, backgroundColor: "#FFF" }}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={{ width: 160, height: 160, borderRadius: 16 }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ width: 160, height: 160, borderRadius: 16, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center" }}>
              <Package size={64} color="#C73030" strokeWidth={1.2} />
            </View>
          )}
        </View>

        {/* Ürün bilgisi */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111", lineHeight: 30 }}>
            {product.name}
          </Text>
          {product.brand ? (
            <Text style={{ fontSize: 16, color: "#666", marginTop: 2 }}>{product.brand}</Text>
          ) : null}
          <Text style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            Porsiyon: {product.nutrition?.serving_size_g ?? 100}g
          </Text>
          {product.sold_in_turkey ? (
            <View style={{ backgroundColor: "#E1F5EE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start", marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: "#0F6E56", fontWeight: "600" }}>
                🇹🇷 Türkiye'de satılıyor
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: "#FAEEDA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start", marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: "#854F0B", fontWeight: "600" }}>
                ⚠️ Yurtdışı{product.origin_country ? ` · ${product.origin_country}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Eksik veri uyarısı */}
        {!product.has_complete_data && (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B" }}>
            <AlertTriangle size={16} color="#92400E" />
            <Text style={{ marginLeft: 8, fontSize: 12, flex: 1, color: "#92400E", lineHeight: 17 }}>
              Bu ürünün besin değerleri eksik, skor tahmini olabilir.
            </Text>
          </View>
        )}

        {/* Skor kartı */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            padding: 20,
            borderRadius: 20,
            backgroundColor: getScoreBgColor(score),
            borderWidth: 1,
            borderColor: getScoreBorderColor(score),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#666", fontWeight: "500" }}>Skor</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 56,
                    lineHeight: 60,
                    color: getScoreTextColor(score),
                  }}
                >
                  {scoreDisplay}
                </Text>
                <Text style={{ fontSize: 18, color: "#999", marginLeft: 4 }}>/100</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: getScoreTextColor(score), lineHeight: 22 }}>
                {scoreLabelText}
              </Text>
            </View>
          </View>
        </View>

        {/* Neden bu skor? */}
        <Pressable
          onPress={() => setShowReasons((v) => !v)}
          style={{ marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: 14, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>Neden bu skor?</Text>
            {showReasons ? <ChevronUp size={20} color="#111" /> : <ChevronDown size={20} color="#111" />}
          </View>

          {showReasons && (
            <View style={{ marginTop: 12 }}>
              {reasons.map((r, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 8, color: r.type === "positive" ? "#16A34A" : r.type === "negative" ? "#DC2626" : "#999" }}>
                    {r.type === "positive" ? "✓" : r.type === "negative" ? "✗" : "•"}
                  </Text>
                  <Text style={{ fontSize: 14, flex: 1, color: "#374151" }}>{r.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: r.points > 0 ? "#16A34A" : r.points < 0 ? "#DC2626" : "#999" }}>
                    {r.points > 0 ? "+" : ""}
                    {r.points}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        {/* Besin değerleri */}
        <View style={{ marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: 14, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB" }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 12 }}>
            Besin değerleri ({product.nutrition?.serving_size_g ?? 100}g)
          </Text>
          {product.nutrition && product.nutrition.calories > 0 ? (
            <>
              <NutritionRow label="Kalori" value={`${product.nutrition.calories} kcal`} />
              <NutritionRow label="Şeker" value={`${product.nutrition.sugar}g`} />
              <NutritionRow label="Doymuş yağ" value={`${product.nutrition.saturated_fat}g`} />
              <NutritionRow label="Sodyum" value={`${product.nutrition.sodium}mg`} />
              <NutritionRow label="Lif" value={`${product.nutrition.fiber}g`} />
              <NutritionRow label="Protein" value={`${product.nutrition.protein}g`} last />
            </>
          ) : (
            <Text style={{ fontSize: 14, color: "#999", textAlign: "center", paddingVertical: 20 }}>
              Bu ürünün besin değerleri veritabanında yok
            </Text>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Alt sticky butonlar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 28,
          backgroundColor: "rgba(255,253,251,0.97)",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable
          onPress={handleAddToDay}
          disabled={saving || !hasData}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: hasData ? "#111" : "#CCC",
            alignItems: "center",
            justifyContent: "center",
            opacity: saving || !hasData ? 0.45 : 1,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: hasData ? "#111" : "#999" }}>
            {saving ? "Kaydediliyor..." : "Güne ekle"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: "/narci", params: { productId: product.barcode } })}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#C73030",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>Narcı'ya sor</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NutritionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: "#F3F4F6" }}>
      <Text style={{ fontSize: 14, color: "#666" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }}>{value}</Text>
    </View>
  );
}
