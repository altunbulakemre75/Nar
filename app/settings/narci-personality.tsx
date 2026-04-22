import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Heart, Calculator, Users, Check, ChevronLeft } from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import type { NarciPersonality } from "@/types/database";
import { PERSONALITY_LABELS, PERSONALITY_DESCRIPTIONS } from "@/types/database";

export default function NarciPersonalityScreen() {
  const user = useAuthStore((s) => s.user);
  const [current, setCurrent] = useState<NarciPersonality>("anne");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("narci_personality")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (data?.narci_personality) setCurrent(data.narci_personality);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const save = async (personality: NarciPersonality) => {
    if (!user || saving) return;
    setSaving(true);
    const prev = current;
    setCurrent(personality);
    const { error } = await supabase
      .from("profiles")
      .update({ narci_personality: personality })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setCurrent(prev);
      Alert.alert("Kaydedilemedi", "Tekrar dene.");
    }
  };

  const options: { id: NarciPersonality; icon: any; color: string }[] = [
    { id: "anne", icon: Heart, color: "#C73030" },
    { id: "muhendis", icon: Calculator, color: "#4A5D23" },
    { id: "yol_arkadasi", icon: Users, color: "#2A5A8A" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2EFEA" }}>
        <ActivityIndicator color="#C73030" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2EFEA" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={20} color="#1C1C1E" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        <Text style={{ fontSize: 34, fontWeight: "700", color: "#1C1C1E", letterSpacing: -0.8, lineHeight: 40, marginTop: 8, marginBottom: 8 }}>
          Aura Kişiliği
        </Text>
        <Text style={{ fontSize: 15, color: "#6B6B70", marginBottom: 28, lineHeight: 22 }}>
          Aura seninle nasıl konuşsun? İstediğin zaman değiştirebilirsin.
        </Text>

        {options.map(({ id, icon: Icon, color }) => {
          const selected = current === id;
          return (
            <Pressable
              key={id}
              onPress={() => save(id)}
              disabled={saving}
              style={{
                backgroundColor: "transparent",
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? color : "#1C1C1E",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <View style={{ backgroundColor: color + "15", padding: 10, borderRadius: 10 }}>
                <Icon size={24} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1C1C1E" }}>
                    {PERSONALITY_LABELS[id]}
                  </Text>
                  {selected && <Check size={18} color={color} strokeWidth={2.5} />}
                </View>
                <Text style={{ fontSize: 14, color: "#6B6B70", marginTop: 4, lineHeight: 20 }}>
                  {PERSONALITY_DESCRIPTIONS[id]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
