import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { GOAL_LABELS, type Goal } from "@/types/database";

const GOAL_ICONS: Record<Goal, string> = {
  lose_weight: "⚖️",
  gain_muscle: "💪",
  clear_skin: "✨",
  reduce_bloat: "🌿",
  better_sleep: "🌙",
  more_energy: "⚡",
  face_sculpt: "🧖",
};

export default function GoalScreen() {
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);

  const goals = Object.keys(GOAL_LABELS) as Goal[];

  return (
    <OnboardingLayout
      step={2}
      title="Hedefin ne?"
      subtitle="Sana özel öneriler için birincil hedefini seç."
      canContinue={goal !== null}
      onContinue={() => router.push("/onboarding/age")}
    >
      <View className="gap-3">
        {goals.map((g) => {
          const selected = goal === g;
          return (
            <Pressable
              key={g}
              onPress={() => setGoal(g)}
              className="flex-row items-center rounded-2xl px-4 py-4 border"
              style={{
                backgroundColor: selected ? "#FFF5F2" : "#FFFFFF",
                borderColor: selected ? "#C73030" : "#EEEEEE",
                borderWidth: selected ? 1.5 : 1,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>{GOAL_ICONS[g]}</Text>
              <Text
                className="flex-1 text-base"
                style={{
                  color: selected ? "#6B1A1A" : "#111",
                  fontWeight: selected ? "600" : "500",
                }}
              >
                {GOAL_LABELS[g]}
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
