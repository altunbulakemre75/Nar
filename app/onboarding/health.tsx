import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { track, reportError } from "@/lib/analytics";

const HEALTH_CONDITIONS = [
  "Diyabet",
  "Yüksek tansiyon",
  "Yüksek kolesterol",
  "Çölyak",
  "Laktoz intoleransı",
  "PCOS",
  "Tiroid",
  "IBS / hassas bağırsak",
];

const ALLERGIES = [
  "Fıstık",
  "Ağaç yemişi",
  "Süt",
  "Yumurta",
  "Buğday / gluten",
  "Soya",
  "Balık",
  "Kabuklu deniz ürünü",
  "Susam",
];

const DIETARY = [
  "Vegan",
  "Vejetaryen",
  "Pesketaryen",
  "Helal",
  "Ketojenik",
  "Az şekerli",
];

export default function HealthScreen() {
  const healthConditions = useOnboardingStore((s) => s.health_conditions);
  const allergies = useOnboardingStore((s) => s.allergies);
  const dietary = useOnboardingStore((s) => s.dietary_restrictions);

  const toggleHealth = useOnboardingStore((s) => s.toggleHealthCondition);
  const toggleAllergy = useOnboardingStore((s) => s.toggleAllergy);
  const toggleDietary = useOnboardingStore((s) => s.toggleDietaryRestriction);

  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleComplete = async () => {
    const state = useOnboardingStore.getState();
    const user = useAuthStore.getState().user;

    const profilePayload = {
      goal: state.goal,
      age: state.age,
      gender: state.gender,
      height_cm: state.height_cm,
      weight_kg: state.weight_kg,
      activity_level: state.activity_level,
      health_conditions: state.health_conditions,
      allergies: state.allergies,
      dietary_restrictions: state.dietary_restrictions,
    };

    // Oturum yoksa (dev / offline durumlar) yine de ana sayfaya geç
    if (!user) {
      router.replace("/(tabs)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...profilePayload, updated_at: new Date().toISOString() });

      if (error) throw error;

      track("onboarding_completed", {
        goal: state.goal,
        gender: state.gender,
        activity_level: state.activity_level,
        has_health_conditions: (state.health_conditions?.length ?? 0) > 0,
        has_allergies: (state.allergies?.length ?? 0) > 0,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      reportError(e, { step: "onboarding_complete" });
      Alert.alert(
        "Kaydedilemedi",
        "Profil bilgileri gönderilemedi. İnternet bağlantını kontrol et.",
        [
          { text: "Tekrar dene", onPress: handleComplete },
          { text: "Şimdilik atla", onPress: () => router.replace("/(tabs)") },
        ]
      );
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      step={7}
      title="Sağlık durumun?"
      subtitle="Uygun olmayan ürünleri filtrelemek için. Bu adım opsiyonel."
      continueLabel="Tamamla"
      onContinue={handleComplete}
    >
      <Section title="Sağlık koşulları" items={HEALTH_CONDITIONS} selected={healthConditions} onToggle={toggleHealth} />
      <Section title="Alerjiler" items={ALLERGIES} selected={allergies} onToggle={toggleAllergy} />
      <Section title="Beslenme tercihi" items={DIETARY} selected={dietary} onToggle={toggleDietary} />

      <Text className="text-xs text-center mt-4 mb-2" style={{ color: "#999" }}>
        Hiçbirini seçmeden de devam edebilirsin
      </Text>
    </OnboardingLayout>
  );
}

function Section({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold mb-3" style={{ color: "#111" }}>
        {title}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {items.map((item) => {
          const isOn = selected.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => onToggle(item)}
              className="rounded-full px-4 py-2.5 border"
              style={{
                backgroundColor: isOn ? "#C73030" : "#FFFFFF",
                borderColor: isOn ? "#C73030" : "#EEEEEE",
                borderWidth: 1.5,
              }}
            >
              <Text
                className="text-sm"
                style={{
                  color: isOn ? "#FFFFFF" : "#444",
                  fontWeight: isOn ? "600" : "500",
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
