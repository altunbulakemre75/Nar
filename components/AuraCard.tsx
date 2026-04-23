import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles, MessageCircle } from "lucide-react-native";

const SAMPLE_QUESTIONS = ["Bugün ne yiyebilirim?", "Şeker fazla mı?", "Atıştırmalık öner"];

export function AuraCard() {
  const openNarci = (prompt?: string) => {
    if (prompt) {
      router.push({ pathname: "/narci", params: { prompt } });
    } else {
      router.push("/narci");
    }
  };

  return (
    <Pressable onPress={() => openNarci()} style={{ marginHorizontal: 16, marginTop: 12 }}>
      <LinearGradient
        colors={["#8E1E24", "#C73030"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 14,
          padding: 12,
          overflow: "hidden",
        }}
      >
        {/* Dekoratif daire */}
        <View
          style={{
            position: "absolute",
            top: -20,
            right: -15,
            width: 80,
            height: 80,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 40,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <Sparkles size={16} color="#FFFFFF" fill="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                Aura'ya Sor
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 1 }}>
                Seni dinliyor
              </Text>
            </View>
          </View>
          <MessageCircle size={14} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Örnek sorular — kompakt chip'ler */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {SAMPLE_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() => openNarci(q)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{q}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
