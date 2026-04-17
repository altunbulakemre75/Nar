import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore } from "@/lib/onboardingStore";

export default function MeasurementsScreen() {
  const storedHeight = useOnboardingStore((s) => s.height_cm);
  const storedWeight = useOnboardingStore((s) => s.weight_kg);
  const setHeight = useOnboardingStore((s) => s.setHeight);
  const setWeight = useOnboardingStore((s) => s.setWeight);

  const [heightText, setHeightText] = useState(storedHeight ? String(storedHeight) : "");
  const [weightText, setWeightText] = useState(storedWeight ? String(storedWeight) : "");

  const h = parseInt(heightText, 10);
  const w = parseFloat(weightText.replace(",", "."));

  const heightValid = !isNaN(h) && h >= 100 && h <= 230;
  const weightValid = !isNaN(w) && w >= 30 && w <= 250;
  const valid = heightValid && weightValid;

  const handleContinue = () => {
    if (!valid) return;
    setHeight(h);
    setWeight(w);
    router.push("/onboarding/activity");
  };

  return (
    <OnboardingLayout
      step={5}
      title="Boyun ve kilon?"
      subtitle="Bu bilgiler kişiye özel porsiyon ve kalori hesabı için gerekli."
      canContinue={valid}
      onContinue={handleContinue}
    >
      <View className="pt-4 gap-6">
        <Field
          label="Boy"
          unit="cm"
          value={heightText}
          onChange={setHeightText}
          valid={heightValid || heightText === ""}
          maxLength={3}
        />

        <Field
          label="Kilo"
          unit="kg"
          value={weightText}
          onChange={setWeightText}
          valid={weightValid || weightText === ""}
          maxLength={5}
        />

        {((heightText !== "" && !heightValid) || (weightText !== "" && !weightValid)) && (
          <Text className="text-xs text-center" style={{ color: "#C73030" }}>
            Geçerli değerler gir (boy: 100-230 cm · kilo: 30-250 kg)
          </Text>
        )}
      </View>
    </OnboardingLayout>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  valid,
  maxLength,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean;
  maxLength: number;
}) {
  return (
    <View>
      <Text className="text-sm mb-2" style={{ color: "#666", fontWeight: "500" }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-2xl px-4 py-3 border"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: valid ? "#EEEEEE" : "#C73030",
          borderWidth: 1.5,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          maxLength={maxLength}
          placeholder="—"
          placeholderTextColor="#CCC"
          style={{
            flex: 1,
            fontSize: 28,
            fontWeight: "600",
            color: "#111",
          }}
        />
        <Text style={{ fontSize: 16, color: "#999", fontWeight: "500" }}>{unit}</Text>
      </View>
    </View>
  );
}
