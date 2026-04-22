import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles, MessageCircle } from "lucide-react-native";

const SAMPLE_QUESTIONS = [
  "Bugün ne yiyebilirim?",
  "Şeker fazla mı?",
  "Atıştırmalık öner",
];

export function AuraCard() {
  const openNarci = (prompt?: string) => {
    if (prompt) {
      router.push({ pathname: "/narci", params: { prompt } });
    } else {
      router.push("/narci");
    }
  };

  return (
    <Pressable onPress={() => openNarci()} style={{ marginHorizontal: 16, marginTop: 16 }}>
      <LinearGradient
        colors={["#8E1E24", "#C73030"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          overflow: "hidden",
        }}
      >
        {/* Dekoratif daireler - glassmorphism hissi */}
        <View
          style={{
            position: "absolute",
            top: -30,
            right: -20,
            width: 120,
            height: 120,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 60,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -40,
            left: -30,
            width: 100,
            height: 100,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 50,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "600" }}>
            Aura'ya Sor
          </Text>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
          Aura seni dinliyor. İstediğini sor, seninle konuşalım.
        </Text>

        {/* Örnek sorular chip olarak */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SAMPLE_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() => openNarci(q)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 13 }}>{q}</Text>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          <MessageCircle size={16} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            Konuşmaya başla →
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
