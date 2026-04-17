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
import { X, Heart, ChevronDown, ChevronUp, Plus, Minus, AlertTriangle, Package } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getProductByBarcode, saveScan } from "@/lib/products";
import { calculateScore, explainScore, hasEnoughDataToScore, type ScoreExplanation } from "@/lib/scoring";
import { scoreColor, scoreLabel, getScoreBgColor, getScoreBorderColor } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import type { Product, Goal } from "@/types/database";
import { checkAchievements } from "@/lib/achievements";

export default function ScanResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [goal, setGoal] = useState<Goal>("lose_weight");
  const [score, setScore] = useState<number | null>(null);
  const [reasons, setReasons] = useState<ScoreExplanation[]>([]);
  const [expanded, setExpanded] = useState(true);
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

      setProduct(p);
      setScore(calculateScore(p, userGoal));
      setReasons(explainScore(p, userGoal));
      setLoading(false);
    })();
  }, [barcode]);

  const handleAddToDay = async () => {
    if (!product) return;
    if (!hasEnoughDataToScore(product)) {
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

    const newlyUnlocked = await checkAchievements();
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

  const hasData = hasEnoughDataToScore(product);
  const hasCompleteData = product.has_complete_data ?? hasData;
  const displayScore = score ?? 0;
  const color = hasData && score !== null ? scoreColor(score) : "#999";
  const label = hasData && score !== null ? scoreLabel(score) : "Yeterli veri yok";
  const scoreBg = hasData && score !== null ? getScoreBgColor(score) : "#F5F5F5";
  const scoreBorder = hasData && score !== null ? getScoreBorderColor(score) : "#DDD";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
          <X size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>Tarama sonucu</Text>
        <Pressable hitSlop={10} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
          <Heart size={22} color="#111" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        {/* Ürün kartı */}
        <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#EEE", flexDirection: "row", alignItems: "center" }}>
          <ProductImage imageUrl={product.image_url} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }} numberOfLines={2}>
              {product.name}
            </Text>
            {product.brand ? (
              <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{product.brand}</Text>
            ) : null}
            {product.sold_in_turkey ? (
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start", marginTop: 6, backgroundColor: "#E1F5EE" }}>
                <Text style={{ fontSize: 11, color: "#0F6E56", fontWeight: "500" }}>
                  🇹🇷 Türkiye'de satılıyor
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start", marginTop: 6, backgroundColor: "#FAEEDA" }}>
                <Text style={{ fontSize: 11, color: "#854F0B", fontWeight: "500" }}>
                  ⚠️ Yurtdışı{product.origin_country ? ` · ${product.origin_country}` : ""}
                </Text>
              </View>
            )}
            {product.nutrition?.serving_size_g ? (
              <Text style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                Porsiyon: {product.nutrition.serving_size_g}g
              </Text>
            ) : null}
          </View>
        </View>

        {/* Eksik veri uyarısı */}
        {!hasCompleteData && hasData && (
          <View style={{ marginTop: 10, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFFBEA", borderColor: "#F5D88A" }}>
            <AlertTriangle size={15} color="#854F0B" strokeWidth={2} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 12, color: "#854F0B", marginLeft: 8, lineHeight: 17 }}>
              Besin verisi eksik olabilir — skor tahminidir.
            </Text>
          </View>
        )}

        {/* Veri hiç yok uyarısı */}
        {!hasData && (
          <View style={{ marginTop: 10, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "flex-start", backgroundColor: "#FFFBEA", borderColor: "#F5D88A" }}>
            <AlertTriangle size={15} color="#854F0B" strokeWidth={2} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 12, color: "#854F0B", marginLeft: 8, lineHeight: 17 }}>
              Bu ürünün besin değerleri eksik veya hiç yok. Skor hesaplanamadı.
            </Text>
          </View>
        )}

        {/* Skor kartı */}
        <View style={{ marginTop: 10, borderRadius: 16, padding: 20, backgroundColor: scoreBg, borderWidth: 1.5, borderColor: scoreBorder }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#666", fontWeight: "500", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Skor
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 56, color, lineHeight: 60 }}>
                  {hasData ? displayScore : "?"}
                </Text>
                <Text style={{ fontSize: 18, color: "#999", marginLeft: 4 }}>/100</Text>
              </View>
            </View>
            <View style={{ flex: 1.2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111", lineHeight: 20 }}>
                {label}
              </Text>
              {hasData && score !== null && (
                <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: "#E5E5E5", overflow: "hidden" }}>
                  <View style={{ width: `${score}%`, height: "100%", borderRadius: 3, backgroundColor: color }} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Neden bu skor? */}
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          style={{ marginTop: 10, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#FFF", borderColor: "#EEE" }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>Neden bu skor?</Text>
          {expanded ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
        </Pressable>

        {expanded && (
          <View style={{ marginTop: 6, borderRadius: 16, borderWidth: 1, overflow: "hidden", backgroundColor: "#FFF", borderColor: "#EEE" }}>
            {reasons.length === 0 ? (
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 13, color: "#999" }}>Yeterli veri yok.</Text>
              </View>
            ) : (
              reasons.map((r, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderBottomWidth: i < reasons.length - 1 ? 1 : 0,
                    borderColor: "#F5F5F5",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      backgroundColor: r.type === "positive" ? "#E8F5E9" : r.type === "negative" ? "#FEECEC" : "#F5F5F5",
                    }}
                  >
                    {r.type === "positive" ? (
                      <Plus size={14} color="#2D8A4E" strokeWidth={3} />
                    ) : r.type === "negative" ? (
                      <Minus size={14} color="#C73030" strokeWidth={3} />
                    ) : (
                      <Text style={{ fontSize: 10, color: "#999" }}>•</Text>
                    )}
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: "#333" }}>{r.label}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: r.type === "positive" ? "#2D8A4E" : r.type === "negative" ? "#C73030" : "#999",
                    }}
                  >
                    {r.points > 0 ? "+" : ""}
                    {r.points}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Besin değerleri */}
        <View style={{ marginTop: 10, borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: "#FFF", borderColor: "#EEE" }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 10 }}>
            Besin değerleri (100g)
          </Text>
          <NutritionRow label="Kalori" value={fmt(product.nutrition?.calories, "kcal")} />
          <NutritionRow label="Şeker" value={fmt(product.nutrition?.sugar, "g")} />
          <NutritionRow label="Doymuş yağ" value={fmt(product.nutrition?.saturated_fat, "g")} />
          <NutritionRow label="Sodyum" value={fmt(product.nutrition?.sodium, "mg")} />
          <NutritionRow label="Lif" value={fmt(product.nutrition?.fiber, "g")} />
          <NutritionRow label="Protein" value={fmt(product.nutrition?.protein, "g")} last />
        </View>

        {/* Ürünü tamamla (V2 placeholder) */}
        {!hasCompleteData && (
          <Pressable
            onPress={() =>
              Alert.alert(
                "Yakında",
                "Ürün bilgilerini tamamlama özelliği bir sonraki sürümde aktif olacak."
              )
            }
            style={{ marginTop: 10, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#FFF5F2", borderColor: "#F5D4CA" }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: "#FFFFFF" }}>
              <Plus size={20} color="#C73030" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B1A1A", marginBottom: 2 }}>
                Bu ürünü sen tamamla
              </Text>
              <Text style={{ fontSize: 12, color: "#8B4848", lineHeight: 16 }}>
                Besin değerlerini girip topluluğa katkı sağla
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#FFFFFF" }}>
              <Text style={{ fontSize: 10, color: "#999", fontWeight: "600" }}>YAKINDA</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Alt butonlar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 12,
          flexDirection: "row",
          gap: 10,
          backgroundColor: "#FFFDFB",
          borderTopWidth: 1,
          borderTopColor: "#EEE",
        }}
      >
        <Pressable
          onPress={handleAddToDay}
          disabled={saving || !hasData}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: hasData ? "#111" : "#CCC",
            alignItems: "center",
            justifyContent: "center",
            opacity: saving || !hasData ? 0.45 : 1,
          }}
        >
          <Text style={{ color: hasData ? "#111" : "#999", fontSize: 15, fontWeight: "600" }}>
            {saving ? "Kaydediliyor..." : "Güne ekle"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push({ pathname: "/narci", params: { productId: product.barcode } })}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: "#C73030",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Narcı'ya sor</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProductImage({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#F5F5F5" }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center" }}>
      <Package size={32} color="#C73030" strokeWidth={1.5} />
    </View>
  );
}

function fmt(value: number | undefined | null, unit: string): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value === 0) {
    return "Veri yok";
  }
  return `${value} ${unit}`;
}

function NutritionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const isEmpty = value === "Veri yok";
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderColor: "#F5F5F5" }}>
      <Text style={{ fontSize: 13, color: "#666" }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          color: isEmpty ? "#BBB" : "#111",
          fontWeight: isEmpty ? "400" : "500",
          fontStyle: isEmpty ? "italic" : "normal",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
