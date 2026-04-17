import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore, type Gender } from "@/lib/onboardingStore";

const OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "female", label: "Kadın", icon: "♀" },
  { value: "male", label: "Erkek", icon: "♂" },
  { value: "other", label: "Diğer / Belirtmek istemiyorum", icon: "•" },
];

export default function GenderScreen() {
  const gender = useOnboardingStore((s) => s.gender);
  const setGender = useOnboardingStore((s) => s.setGender);

  return (
    <OnboardingLayout
      step={4}
      title="Cinsiyetin?"
      subtitle="Bu bilgi kalori ve besin ihtiyaçlarını daha doğru hesaplamamızı sağlar."
      canContinue={gender !== null}
      onContinue={() => router.push("/onboarding/measurements")}
    >
      <View className="gap-3 pt-4">
        {OPTIONS.map((opt) => {
          const selected = gender === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setGender(opt.value)}
              className="flex-row items-center rounded-2xl px-5 py-5 border"
              style={{
                backgroundColor: selected ? "#FFF5F2" : "#FFFFFF",
                borderColor: selected ? "#C73030" : "#EEEEEE",
                borderWidth: selected ? 1.5 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "600",
                  marginRight: 14,
                  color: selected ? "#C73030" : "#999",
                  width: 28,
                  textAlign: "center",
                }}
              >
                {opt.icon}
              </Text>
              <Text
                className="flex-1 text-base"
                style={{
                  color: selected ? "#6B1A1A" : "#111",
                  fontWeight: selected ? "600" : "500",
                }}
              >
                {opt.label}
              </Text>
              {selected && (
                <View
                  className="w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#C73030" }}
                >
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
