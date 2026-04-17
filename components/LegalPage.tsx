import { ReactNode } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";

interface Props {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalPage({ title, updatedAt, children }: Props) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <ChevronLeft size={26} color="#111" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#111", marginTop: 8, marginBottom: 6 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>
          Son güncelleme: {updatedAt}
        </Text>

        <View style={{ gap: 12 }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function H({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 16, fontWeight: "700", color: "#111", marginTop: 12 }}>
      {children}
    </Text>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 14, color: "#444", lineHeight: 22 }}>
      {children}
    </Text>
  );
}
