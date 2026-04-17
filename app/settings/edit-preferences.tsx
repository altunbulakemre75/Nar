import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/authStore";

type Field = "dietary_restrictions" | "health_conditions" | "allergies";

const FIELD_CONFIG: Record<
  Field,
  { title: string; subtitle: string; options: string[] }
> = {
  dietary_restrictions: {
    title: "Diyet Kısıtlamaları",
    subtitle: "Uyduğun diyetleri seç",
    options: [
      "Vejetaryen",
      "Vegan",
      "Ketojenik",
      "Akdeniz diyeti",
      "Düşük karbonhidrat",
      "Yüksek protein",
      "Aralıklı oruç",
      "Helal",
      "Glutensiz",
      "Şekersiz",
    ],
  },
  health_conditions: {
    title: "Sağlık Durumları",
    subtitle: "Bilmemizi istediğin sağlık koşulları",
    options: [
      "Diyabet",
      "Yüksek tansiyon",
      "Yüksek kolesterol",
      "Çölyak",
      "Laktoz intoleransı",
      "PCOS",
      "Tiroid",
      "IBS / hassas bağırsak",
      "IBD",
      "Kalp hastalığı riski",
    ],
  },
  allergies: {
    title: "Alerjiler",
    subtitle: "Alerjik olduğun besinler",
    options: [
      "Fıstık",
      "Ağaç yemişi",
      "Süt",
      "Yumurta",
      "Buğday / gluten",
      "Soya",
      "Balık",
      "Kabuklu deniz ürünü",
      "Susam",
    ],
  },
};

const VALID_FIELDS: Field[] = ["dietary_restrictions", "health_conditions", "allergies"];

export default function EditPreferencesScreen() {
  const { field: rawField } = useLocalSearchParams<{ field?: string }>();
  const user = useAuthStore((s) => s.user);

  const field = (VALID_FIELDS as string[]).includes(rawField ?? "")
    ? (rawField as Field)
    : null;

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const config = field ? FIELD_CONFIG[field] : null;

  useEffect(() => {
    if (!user || !field) return;
    supabase
      .from("profiles")
      .select(field)
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const val = (data as any)?.[field];
        setSelected(Array.isArray(val) ? val : []);
        setLoading(false);
      });
  }, [user, field]);

  const toggle = (item: string) => {
    setSelected((cur) => (cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]));
  };

  const handleSave = async () => {
    if (!user || !field) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: selected })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Hata", "Kaydedilemedi. Tekrar dene.");
      return;
    }
    router.back();
  };

  if (!field || !config) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={26} color="#111" strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#111", textAlign: "center" }}>
            Geçersiz düzenleme alanı
          </Text>
          <Text style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 6 }}>
            Profil ekranından tekrar dene.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={26} color="#111" strokeWidth={2.2} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#111" }}>{config.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>{config.subtitle}</Text>

        {loading ? (
          <ActivityIndicator color="#C73030" />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {config.options.map((opt) => {
              const on = selected.includes(opt);
              return (
                <Pressable
                  key={opt}
                  onPress={() => toggle(opt)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: on ? "#C73030" : "#FFF",
                    borderWidth: 1,
                    borderColor: on ? "#C73030" : "#E5E7EB",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {on && <Check size={14} color="#FFF" strokeWidth={2.5} />}
                  <Text style={{ fontSize: 14, fontWeight: "600", color: on ? "#FFF" : "#111" }}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, backgroundColor: "rgba(255,253,251,0.97)", borderTopWidth: 1, borderTopColor: "#EEE" }}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            height: 54,
            borderRadius: 27,
            backgroundColor: "#111",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving && <ActivityIndicator color="#FFF" size="small" />}
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
