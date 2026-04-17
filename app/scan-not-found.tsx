import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { X, PackageSearch, Plus } from "lucide-react-native";

export default function ScanNotFound() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="w-9 h-9 items-center justify-center"
        >
          <X size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>Tarama sonucu</Text>
        <View className="w-9 h-9" />
      </View>

      <View className="flex-1 px-6 items-center justify-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: "#FFF5F2" }}
        >
          <PackageSearch size={36} color="#C73030" strokeWidth={1.6} />
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#111",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Bu ürünü bulamadık
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            textAlign: "center",
            marginBottom: 4,
            lineHeight: 20,
          }}
        >
          Ne kendi veritabanımızda ne de{"\n"}Open Food Facts'te kayıtlı.
        </Text>

        {barcode ? (
          <View className="mt-4 px-4 py-2 rounded-full" style={{ backgroundColor: "#F5F5F5" }}>
            <Text
              style={{
                fontSize: 14,
                color: "#444",
                fontFamily: "Courier",
                fontWeight: "600",
                letterSpacing: 1,
              }}
            >
              {barcode}
            </Text>
          </View>
        ) : null}

        {/* Sen ekle kartı (V2'de aktif) */}
        <View
          className="mt-8 rounded-2xl border p-4 flex-row items-center"
          style={{ backgroundColor: "#FFF5F2", borderColor: "#F5D4CA" }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Plus size={20} color="#C73030" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: "#6B1A1A", marginBottom: 2 }}
            >
              Ürünü sen ekle
            </Text>
            <Text style={{ fontSize: 12, color: "#8B4848", lineHeight: 16 }}>
              Ürün bilgilerini girip diğer kullanıcılarla paylaşabilirsin
            </Text>
          </View>
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FFFFFF" }}>
            <Text style={{ fontSize: 10, color: "#999", fontWeight: "600" }}>YAKINDA</Text>
          </View>
        </View>
      </View>

      {/* Alt butonlar */}
      <View className="px-4 pb-6" style={{ gap: 10 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)/scan")}
          style={{
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: "#C73030",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Tekrar dene</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="py-3 items-center"
        >
          <Text style={{ fontSize: 14, color: "#666", fontWeight: "500" }}>Ana sayfaya dön</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
