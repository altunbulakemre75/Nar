import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore } from "@/lib/onboardingStore";

export default function AgeScreen() {
  const storedAge = useOnboardingStore((s) => s.age);
  const setAge = useOnboardingStore((s) => s.setAge);

  const [text, setText] = useState(storedAge ? String(storedAge) : "");

  const parsed = parseInt(text, 10);
  const valid = !isNaN(parsed) && parsed >= 13 && parsed <= 100;

  const handleContinue = () => {
    if (!valid) return;
    setAge(parsed);
    router.push("/onboarding/gender");
  };

  return (
    <OnboardingLayout
      step={3}
      title="Kaç yaşındasın?"
      subtitle="Yaşa göre günlük ihtiyaçların değişir."
      canContinue={valid}
      onContinue={handleContinue}
    >
      <View className="items-center pt-8">
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="—"
          placeholderTextColor="#CCC"
          autoFocus
          style={{
            fontFamily: "Inter-Medium",
            fontSize: 72,
            color: "#C73030",
            textAlign: "center",
            minWidth: 160,
            paddingVertical: 8,
            borderBottomWidth: 2,
            borderBottomColor: valid ? "#C73030" : "#EEEEEE",
          }}
        />
        <Text className="mt-2 text-sm" style={{ color: "#999" }}>
          yaş
        </Text>

        {text !== "" && !valid && (
          <Text className="mt-6 text-xs text-center" style={{ color: "#C73030" }}>
            13-100 arası bir yaş girmelisin
          </Text>
        )}
      </View>
    </OnboardingLayout>
  );
}
