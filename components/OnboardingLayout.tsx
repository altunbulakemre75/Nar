import { ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";

interface Props {
  step: number;               // 1-7
  total?: number;              // default 7
  title: string;
  subtitle?: string;
  children: ReactNode;
  canContinue?: boolean;       // disable button if false
  continueLabel?: string;      // "Devam" default
  onContinue: () => void;
  showBack?: boolean;
}

export default function OnboardingLayout({
  step,
  total = 7,
  title,
  subtitle,
  children,
  canContinue = true,
  continueLabel = "Devam",
  onContinue,
  showBack = true,
}: Props) {
  const progress = Math.max(0, Math.min(1, step / total));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }} edges={["top", "bottom"]}>
      {/* Üst bar: geri oku + progress */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="mr-3 w-9 h-9 items-center justify-center rounded-full"
            >
              <ChevronLeft size={26} color="#111" strokeWidth={2} />
            </Pressable>
          ) : (
            <View className="mr-3 w-9 h-9" />
          )}

          <View className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#EEEEEE" }}>
            <View
              className="h-1.5 rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: "#C73030" }}
            />
          </View>

          <Text className="ml-3 text-xs font-medium" style={{ color: "#6B1A1A" }}>
            {step}/{total}
          </Text>
        </View>
      </View>

      {/* Başlık */}
      <View className="px-6 pt-4 pb-6">
        <Text
          style={{ fontSize: 26, fontWeight: "700", color: "#111", lineHeight: 32 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-2 text-sm" style={{ color: "#666" }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Orta içerik */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Alt: devam butonu */}
      <View className="px-6 pb-6 pt-2">
        <Pressable
          disabled={!canContinue}
          onPress={onContinue}
          className="py-4 rounded-full items-center"
          style={{
            backgroundColor: canContinue ? "#C73030" : "#E5B9B9",
          }}
        >
          <Text className="text-white font-semibold text-base">{continueLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
