import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ChevronLeft, Camera } from "lucide-react-native";

export default function ScanNotFound() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={28} color="#FFF" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 24,
            padding: 28,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: "#FFF",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Yeni ürün buldun ✨
          </Text>

          <View
            style={{
              width: 180,
              height: 240,
              borderRadius: 16,
              backgroundColor: "#FFF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111", textAlign: "center", marginBottom: 8 }}>
              Nutrition Facts
            </Text>
            <View style={{ width: "100%", height: 1, backgroundColor: "#111", marginBottom: 8 }} />
            <Text style={{ fontSize: 11, color: "#111" }}>Serving size 1 Tbsp. (21g)</Text>
            <View style={{ width: "100%", height: 4, backgroundColor: "#111", marginVertical: 6 }} />
            <Text style={{ fontSize: 11, color: "#111", alignSelf: "flex-start" }}>Amount per serving</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111", alignSelf: "flex-start" }}>
              Calories 60
            </Text>
            <View style={{ width: "100%", height: 1, backgroundColor: "#111", marginVertical: 4 }} />
            <Text style={{ fontSize: 10, color: "#111" }}>Total Fat 0g · Sugar 17g</Text>
            <Text style={{ fontSize: 10, color: "#111", marginTop: 2 }}>Protein 0g</Text>
          </View>

          <Text
            style={{
              fontSize: 16,
              color: "#CCC",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 8,
            }}
          >
            Besin etiketini fotoğrafla,{"\n"}AI özel analiz yapsın.
          </Text>

          {barcode ? (
            <Text style={{ fontSize: 11, color: "#666", marginTop: 6, fontFamily: "Courier" }}>
              {barcode}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ padding: 20, gap: 10 }}>
        <Pressable
          onPress={() => router.push({ pathname: "/scan-label", params: { barcode: barcode ?? "" } })}
          style={{
            backgroundColor: "#FFF",
            paddingVertical: 16,
            borderRadius: 30,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Camera size={20} color="#111" strokeWidth={2} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>Etiketi Tara</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)")} style={{ paddingVertical: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 15, color: "#FFF", fontWeight: "600" }}>Kapat</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
