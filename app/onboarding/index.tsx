import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import NarAuraLogo from "@/components/NarLogo";
import { useOnboardingStore } from "@/lib/onboardingStore";

export default function OnboardingWelcome() {
  const skip = () => {
    // Boş/yarım kalan onboarding state'ini temizle
    useOnboardingStore.getState().reset();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      <View className="flex-1 items-center justify-center px-8">
        <NarAuraLogo size={72} showTagline={false} />

        <Text
          className="mt-4 text-lg text-center"
          style={{ color: "#6B1A1A", fontWeight: "500" }}
        >
          Ne yediğini bil, iyi hisset
        </Text>

        <Text className="mt-6 text-sm text-center" style={{ color: "#666", lineHeight: 20 }}>
          Sana özel bir beslenme deneyimi için{"\n"}
          birkaç küçük soru soracağız.{"\n"}
          Yaklaşık 1 dakika sürer.
        </Text>

        {/* Gizlilik sözü */}
        <View
          style={{
            marginTop: 32,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: "#F0F9F0",
            borderWidth: 1,
            borderColor: "#C8E6C9",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <ShieldCheck size={20} color="#2E7D32" strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#2E7D32", marginBottom: 3 }}>
              Gizlilik sözümüz
            </Text>
            <Text style={{ fontSize: 12, color: "#2E4A2F", lineHeight: 17 }}>
              Sağlık verin sadece senindir. Üçüncü taraflara satılmaz, reklam için
              kullanılmaz. KVKK uyumlu, Frankfurt (AB) sunucularında şifreli.
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Pressable
          onPress={() => router.push("/onboarding/goal")}
          className="py-4 rounded-full items-center"
          style={{ backgroundColor: "#C73030" }}
        >
          <Text className="text-white font-semibold text-base">Başlayalım</Text>
        </Pressable>

        <Pressable onPress={skip} className="py-3 mt-2 items-center">
          <Text className="text-sm" style={{ color: "#999" }}>
            Şimdilik atla
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
