import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { ACTIVITY_LABELS, type ActivityLevel } from "@/types/database";

const DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: "Çoğunlukla oturarak çalışıyorum, az yürüyorum",
  light: "Haftada 1-2 kez hafif egzersiz yapıyorum",
  moderate: "Haftada 3-4 kez orta tempo egzersiz yapıyorum",
  active: "Haftada 5-6 kez aktif egzersiz yapıyorum",
  very_active: "Her gün yoğun egzersiz / fiziksel iş",
};

export default function ActivityScreen() {
  const activity = useOnboardingStore((s) => s.activity_level);
  const setActivity = useOnboardingStore((s) => s.setActivityLevel);

  const levels = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];

  return (
    <OnboardingLayout
      step={6}
      title="Ne kadar aktifsin?"
      subtitle="Günlük kalori ihtiyacını buna göre ayarlıyoruz."
      canContinue={activity !== null}
      onContinue={() => router.push("/onboarding/health")}
    >
      <View className="gap-3">
        {levels.map((lvl) => {
          const selected = activity === lvl;
          return (
            <Pressable
              key={lvl}
              onPress={() => setActivity(lvl)}
              className="rounded-2xl px-4 py-4 border"
              style={{
                backgroundColor: selected ? "#FFF5F2" : "#FFFFFF",
                borderColor: selected ? "#C73030" : "#EEEEEE",
                borderWidth: selected ? 1.5 : 1,
              }}
            >
              <View className="flex-row items-center">
                <Text
                  className="flex-1 text-base"
                  style={{
                    color: selected ? "#6B1A1A" : "#111",
                    fontWeight: "600",
                  }}
                >
                  {ACTIVITY_LABELS[lvl]}
                </Text>
                {selected && (
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#C73030" }}
                  >
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-xs mt-1"
                style={{ color: selected ? "#8B4848" : "#888" }}
              >
                {DESCRIPTIONS[lvl]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
