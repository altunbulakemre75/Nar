import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Heart, Package } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useFavoritesStore } from "@/lib/favorites";
import { getScoreBgColor, getScoreBorderColor, getScoreTextColor } from "@/constants/colors";
import { calculateScore } from "@/lib/scoring";
import type { Product, Goal } from "@/types/database";

interface FavItem {
  product: Product;
  score: number;
}

export default function FavoritesScreen() {
  const barcodes = useFavoritesStore((s) => s.barcodes);
  const toggle = useFavoritesStore((s) => s.toggle);

  const [items, setItems] = useState<FavItem[] | null>(null);

  useEffect(() => {
    if (barcodes.length === 0) {
      setItems([]);
      return;
    }
    (async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        let goal: Goal = "lose_weight";
        if (user) {
          const { data } = await supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle();
          if (data?.goal) goal = data.goal as Goal;
        }

        const { data: products } = await supabase
          .from("products")
          .select("*")
          .in("barcode", barcodes);

        const list: FavItem[] = (products ?? []).map((p) => ({
          product: p as Product,
          score: calculateScore(p as Product, goal),
        }));
        // Saklama sırasına göre sırala — O(1) lookup
        const orderIdx = new Map(barcodes.map((b, i) => [b, i]));
        list.sort((a, b) => (orderIdx.get(a.product.barcode) ?? 0) - (orderIdx.get(b.product.barcode) ?? 0));
        setItems(list);
      } catch {
        setItems([]);
      }
    })();
  }, [barcodes]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={26} color="#111" strokeWidth={2.2} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>Favorilerim</Text>
      </View>

      {items === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#C73030" />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Heart size={40} color="#C73030" strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" }}>
            Henüz favorin yok
          </Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginTop: 8 }}>
            Bir ürün taradığında sağ üstteki kalp ikonuna basarak favorilerine ekleyebilirsin.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {items.map((it) => (
            <FavRow key={it.product.barcode} item={it} onUnfav={() => toggle(it.product.barcode)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FavRow({ item, onUnfav }: { item: FavItem; onUnfav: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { product, score } = item;
  const ringColor = getScoreBorderColor(score);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/scan-result", params: { barcode: product.barcode } })}
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
          width: 64,
          height: 64,
          borderRadius: 12,
          backgroundColor: "#FFF",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 4,
        }}
      >
        {product.image_url && !imgFailed ? (
          <Image
            source={{ uri: product.image_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Package size={28} color="#C73030" strokeWidth={1.5} />
        )}
      </View>
      <View style={{ marginLeft: 14, flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }} numberOfLines={1}>
          {product.brand ?? "—"}
        </Text>
        <View style={{ marginTop: 8, flexDirection: "row" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: getScoreBgColor(score),
              borderWidth: 1,
              borderColor: ringColor,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: getScoreTextColor(score) }}>
              Skor: {score < 0 ? "?" : score}
            </Text>
          </View>
        </View>
      </View>
      <Pressable onPress={onUnfav} hitSlop={10} style={{ padding: 6 }}>
        <Heart size={20} color="#C73030" fill="#C73030" strokeWidth={2} />
      </Pressable>
      <ChevronRight size={18} color="#999" />
    </Pressable>
  );
}
