import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
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
