import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  X,
  Sparkles,
  MessageCircle,
  Camera,
  BarChart3,
  Star,
  Check,
} from "lucide-react-native";
import { track } from "@/lib/analytics";

type Plan = "monthly" | "yearly";

const PLANS: Record<Plan, { label: string; price: string; sub: string; save?: string }> = {
  monthly: { label: "Aylık", price: "99₺", sub: "/ay" },
  yearly: { label: "Yıllık", price: "499₺", sub: "/yıl", save: "58% tasarruf" },
};

export default function PremiumScreen() {
  const [plan, setPlan] = useState<Plan>("yearly");

  const handlePurchase = () => {
    track("premium_cta_clicked", { plan });
    Alert.alert(
      "Yakında",
      "Premium abonelikler çok yakında aktif olacak. Launch'ta haberin olsun — destek@narapp.com'a e-posta at."
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <LinearGradient
        colors={["#FFF5F2", "#FFE4DE", "#FFFDFB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />

      <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <X size={26} color="#111" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Üst başlık */}
        <View style={{ alignItems: "center", marginTop: 4, marginBottom: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#C73030", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Sparkles size={34} color="#FFF" strokeWidth={2} fill="#FFF" />
          </View>
          <Text style={{ fontSize: 30, fontWeight: "800", color: "#111", textAlign: "center" }}>
            Nar Aura Premium
          </Text>
          <Text style={{ fontSize: 15, color: "#666", textAlign: "center", marginTop: 6, lineHeight: 22, paddingHorizontal: 10 }}>
            Sınırsız AI sohbet, fotoğraf analizi ve detaylı raporlar.
          </Text>
        </View>

        {/* Özellikler */}
        <View style={{ gap: 10, marginBottom: 24 }}>
          <Feature
            icon={<MessageCircle size={20} color="#C73030" strokeWidth={2} />}
            title="Sınırsız Narcı AI"
            description="İstediğin kadar soru sor — günlük limit yok."
          />
          <Feature
            icon={<Camera size={20} color="#C73030" strokeWidth={2} />}
            title="Fotoğraf analizi"
            description="Tabak fotoğrafı çek, Narcı kalori ve besin tahmini yapsın."
          />
          <Feature
            icon={<BarChart3 size={20} color="#C73030" strokeWidth={2} />}
            title="Detaylı raporlar"
            description="Haftalık / aylık trend, makro dağılımı, besin eksikleri."
          />
          <Feature
            icon={<Star size={20} color="#C73030" strokeWidth={2} />}
            title="Erken erişim"
            description="Yeni özelliklere herkesten önce eriş."
          />
        </View>

        {/* Plan seçici */}
        <View style={{ gap: 10, marginBottom: 18 }}>
          {(["yearly", "monthly"] as Plan[]).map((p) => {
            const active = plan === p;
            const info = PLANS[p];
            return (
              <Pressable
                key={p}
                onPress={() => setPlan(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: active ? "#C73030" : "#E5E7EB",
                  backgroundColor: active ? "#FFF5F2" : "#FFF",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? "#C73030" : "#CCC",
                    backgroundColor: active ? "#C73030" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  {active && <Check size={12} color="#FFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>{info.label}</Text>
                    {info.save && (
                      <View style={{ backgroundColor: "#C73030", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>{info.save}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                    {p === "yearly" ? "İlk 7 gün ücretsiz — istediğin zaman iptal et" : "İlk 3 gün ücretsiz"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#C73030" }}>{info.price}</Text>
                  <Text style={{ fontSize: 11, color: "#888" }}>{info.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handlePurchase}
          style={{
            height: 56,
            borderRadius: 28,
            backgroundColor: "#111",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>
            Premium'a geç
          </Text>
        </Pressable>

        <Text style={{ fontSize: 11, color: "#888", textAlign: "center", lineHeight: 16 }}>
          Abonelik otomatik yenilenir. İstediğin zaman{" "}
          <Text style={{ fontWeight: "600", color: "#555" }}>Ayarlar › Abonelikler</Text>{" "}
          bölümünden iptal edebilirsin.
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16 }}>
          <Pressable onPress={() => router.push("/legal/terms")}>
            <Text style={{ fontSize: 12, color: "#888" }}>Koşullar</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/legal/privacy")}>
            <Text style={{ fontSize: 12, color: "#888" }}>Gizlilik</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert("Yakında", "Geri yükleme, store entegrasyonu bitince aktif olacak.")}
          >
            <Text style={{ fontSize: 12, color: "#888" }}>Geri yükle</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 14, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EEE" }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>{title}</Text>
        <Text style={{ fontSize: 13, color: "#666", marginTop: 2, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
    </View>
  );
}
