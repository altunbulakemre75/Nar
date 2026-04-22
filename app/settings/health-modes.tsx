import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, AlertCircle } from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import type { HealthMode } from "@/types/database";
import { HEALTH_MODE_LABELS, HEALTH_MODE_DESCRIPTIONS } from "@/types/database";

const MODES: HealthMode[] = [
  "glp1",
  "diabet_1",
  "diabet_2",
  "ibs",
  "pcos",
  "hamilelik",
  "emzirme",
];

export default function HealthModesScreen() {
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState<HealthMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("health_modes")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (data?.health_modes) setActive(data.health_modes);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const toggle = async (mode: HealthMode) => {
    if (!user || saving) return;
    const newModes = active.includes(mode)
      ? active.filter((m) => m !== mode)
      : [...active, mode];

    const prev = active;
    setActive(newModes);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ health_modes: newModes })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setActive(prev);
      Alert.alert("Kaydedilemedi", "Tekrar dene.");
    }
  };

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
          Sağlık Modları
        </Text>
        <Text style={{ fontSize: 15, color: "#6B6B70", marginBottom: 20, lineHeight: 22 }}>
          Aura'nın sana vereceği tavsiyeyi sağlık durumuna göre kişiselleştir. İstediğin kadar aktif bırakabilirsin.
        </Text>

        {/* Uyarı kutusu */}
        <View
          style={{
            backgroundColor: "#FFF3E0",
            borderLeftWidth: 4,
            borderLeftColor: "#FF9800",
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <AlertCircle size={20} color="#FF9800" />
          <Text style={{ flex: 1, fontSize: 13, color: "#5D4410", lineHeight: 18 }}>
            Bu modlar tıbbi tavsiye yerine geçmez. Doktorunla/diyetisyeninle konuşmayı unutma.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {MODES.map((mode) => {
            const isActive = active.includes(mode);
            return (
              <View
                key={mode}
                style={{
                  backgroundColor: "transparent",
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: isActive ? "#C73030" : "#1C1C1E",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E" }}>
                      {HEALTH_MODE_LABELS[mode]}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B6B70", marginTop: 4, lineHeight: 18 }}>
                      {HEALTH_MODE_DESCRIPTIONS[mode]}
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggle(mode)}
                    trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                    thumbColor="#FFF"
                    ios_backgroundColor="#E5E5EA"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
