import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { X, Heart, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getProductByBarcode, saveScan } from "@/lib/products";
import { calculateScore, explainScore, type ScoreExplanation } from "@/lib/scoring";
import { scoreColor, scoreLabel } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import type { Product, Goal } from "@/types/database";
import { checkAchievements } from "@/lib/achievements";

export default function ScanResultScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [goal, setGoal] = useState<Goal>("lose_weight");
  const [score, setScore] = useState(0);
  const [reasons, setReasons] = useState<ScoreExplanation[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!barcode) return;

      // Kullanıcı profilinden hedefi al
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
    setSaving(true);
    const savedScore = await saveScan(product, goal);

    if (savedScore === null) {
      setSaving(false);
      Alert.alert("Hata", "Kaydedilemedi. Tekrar dene.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Achievement kontrolü
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
          <Text className="mt-4 text-sm" style={{ color: "#666" }}>
            Ürün bulunuyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const color = scoreColor(score);
  const label = scoreLabel(score);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <X size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>Tarama sonucu</Text>
        <Pressable hitSlop={10} className="w-9 h-9 items-center justify-center">
          <Heart size={22} color="#111" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        {/* Ürün kartı */}
        <View
          className="rounded-2xl p-4 border flex-row items-center"
          style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
        >
          <View
            className="w-20 h-20 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#FFF5F2" }}
          >
            <Text style={{ fontSize: 28 }}>📦</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>{product.name}</Text>
            {product.brand ? (
              <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{product.brand}</Text>
            ) : null}
            {product.sold_in_turkey ? (
              <View
                className="flex-row items-center px-2.5 py-1 rounded-full self-start mt-1.5"
                style={{ backgroundColor: "#E1F5EE" }}
              >
                <Text style={{ fontSize: 11, color: "#0F6E56", fontWeight: "500" }}>
                  🇹🇷 Türkiye'de satılıyor
                </Text>
              </View>
            ) : (
              <View
                className="flex-row items-center px-2.5 py-1 rounded-full self-start mt-1.5"
                style={{ backgroundColor: "#FAEEDA" }}
              >
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

        {/* Skor kartı */}
        <View
          className="mt-3 rounded-2xl p-5"
          style={{ backgroundColor: color + "22", borderWidth: 1.5, borderColor: color }}
        >
          <View className="flex-row items-center">
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: "#666", fontWeight: "500", marginBottom: 2 }}>
                Skor
              </Text>
              <View className="flex-row items-baseline">
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 56, color, lineHeight: 60 }}>
                  {score}
                </Text>
                <Text style={{ fontSize: 18, color: "#666", marginLeft: 4 }}>/100</Text>
              </View>
            </View>
            <View style={{ flex: 1.2 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111", lineHeight: 20 }}>
                {label}
              </Text>
            </View>
          </View>
        </View>

        {/* Neden bu skor? */}
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="mt-3 rounded-2xl border flex-row items-center justify-between p-4"
          style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>Neden bu skor?</Text>
          {expanded ? (
            <ChevronUp size={18} color="#999" />
          ) : (
            <ChevronDown size={18} color="#999" />
          )}
        </Pressable>

        {expanded && (
          <View
            className="mt-2 rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
          >
            {reasons.map((r, i) => (
              <View
                key={i}
                className={`px-4 py-3 flex-row items-center ${
                  i < reasons.length - 1 ? "border-b" : ""
                }`}
                style={{ borderColor: "#F5F5F5" }}
              >
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor:
                      r.type === "positive" ? "#E8F5E9" : r.type === "negative" ? "#FEECEC" : "#F5F5F5",
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
                    color:
                      r.type === "positive" ? "#2D8A4E" : r.type === "negative" ? "#C73030" : "#999",
                  }}
                >
                  {r.points > 0 ? "+" : ""}
                  {r.points}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Besin değerleri */}
        {product.nutrition ? (
          <View
            className="mt-3 rounded-2xl border p-4"
            style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 10 }}>
              Besin değerleri (100g)
            </Text>
            <NutritionRow label="Kalori" value={`${product.nutrition.calories} kcal`} />
            <NutritionRow label="şeker" value={`${product.nutrition.sugar} g`} />
            <NutritionRow label="DoymuŞ yağ" value={`${product.nutrition.saturated_fat} g`} />
            <NutritionRow label="Sodyum" value={`${product.nutrition.sodium} mg`} />
            <NutritionRow label="Lif" value={`${product.nutrition.fiber} g`} />
            <NutritionRow label="Protein" value={`${product.nutrition.protein} g`} last />
          </View>
        ) : null}
      </ScrollView>

      {/* Alt butonlar */}
      <View
        className="absolute left-0 right-0 bottom-0 px-4 pb-6 pt-3 flex-row"
        style={{ backgroundColor: "#FFFDFB", borderTopWidth: 1, borderTopColor: "#EEE", gap: 10 }}
      >
        <Pressable
          onPress={handleAddToDay}
          disabled={saving}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: "#111",
            alignItems: "center",
            justifyContent: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#111", fontSize: 15, fontWeight: "600" }}>
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

function NutritionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className="flex-row justify-between py-2"
      style={{ borderBottomWidth: last ? 0 : 1, borderColor: "#F5F5F5" }}
    >
      <Text style={{ fontSize: 13, color: "#666" }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#111", fontWeight: "500" }}>{value}</Text>
    </View>
  );
}
