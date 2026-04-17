import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, Camera, Check, RotateCcw } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { extractNutritionFromImage } from "@/lib/nutritionOCR";
import { track, reportError } from "@/lib/analytics";
import type { Nutrition } from "@/types/database";

export default function ScanLabelScreen() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Hata", "Görsel yüklenemedi.");
      return;
    }

    setPhotoUri(asset.uri);
    setPhotoBase64(asset.base64);
    analyze(asset.base64);
  };

  const analyze = async (base64: string) => {
    setLoading(true);
    try {
      const result = await extractNutritionFromImage(base64);
      if (!result || result.confidence === "low") {
        Alert.alert(
          "Okuyamadım",
          "Etiket net değil. Tekrar dener misin?",
          [{ text: "Tamam" }]
        );
        setNutrition(null);
        setLoading(false);
        return;
      }
      setNutrition(result.nutrition);
      if (result.productName) setProductName(result.productName);
      if (result.brand) setBrand(result.brand);
      track("product_scanned", {
        via: "label_ocr",
        barcode: barcode ?? null,
        has_data: true,
      });
    } catch (e) {
      reportError(e, { where: "scan-label.analyze" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nutrition) return;
    if (!productName.trim()) {
      Alert.alert("İsim eksik", "Ürün adı girmelisin.");
      return;
    }
    setSaving(true);
    try {
      const finalBarcode = barcode ?? `local-${Date.now()}`;
      const payload = {
        barcode: finalBarcode,
        name: productName.trim(),
        brand: brand.trim() || null,
        category: null,
        image_url: null,
        ingredients: null,
        nutrition,
        additives: [],
        is_organic: false,
        sold_in_turkey: true,
        origin_country: "TR",
        country: "TR",
        verified: false,
        has_complete_data: true,
      };

      // UPSERT: barkod varsa update, yoksa insert
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", finalBarcode)
        .maybeSingle();

      if (existing) {
        await supabase.from("products").update(payload).eq("barcode", finalBarcode);
      } else {
        await supabase.from("products").insert(payload);
      }

      router.replace({ pathname: "/scan-result", params: { barcode: finalBarcode } });
    } catch (e) {
      reportError(e, { where: "scan-label.handleSave" });
      Alert.alert("Hata", "Kaydedilemedi, tekrar dene.");
    } finally {
      setSaving(false);
    }
  };

  const resetPhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setNutrition(null);
  };

  if (!photoUri) {
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
              }}
            >
              <Text style={{ fontSize: 60 }}>📋</Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                color: "#CCC",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Besin etiketini fotoğrafla,{"\n"}AI skorunu hesaplasın.
            </Text>
          </View>
        </View>

        <View style={{ padding: 20, gap: 10 }}>
          <Pressable
            onPress={() => pickImage(true)}
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
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
              Etiketi Fotoğrafla
            </Text>
          </Pressable>

          <Pressable onPress={() => pickImage(false)} style={{ paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#999" }}>Galeriden seç</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={{ paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 15, color: "#FFF", fontWeight: "600" }}>İptal</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#111" }}>Etiket Tara</Text>
        <Pressable onPress={resetPhoto} hitSlop={10}>
          <RotateCcw size={22} color="#111" strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Image
          source={{ uri: photoUri }}
          style={{ width: "100%", height: 260, borderRadius: 16, backgroundColor: "#F5F5F5" }}
          resizeMode="cover"
        />

        {loading ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <ActivityIndicator size="large" color="#C73030" />
            <Text style={{ marginTop: 12, color: "#666" }}>AI etiketi okuyor...</Text>
          </View>
        ) : nutrition ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", marginTop: 20, marginBottom: 8 }}>
              Ürün Bilgisi
            </Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="Ürün adı *"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="Marka (opsiyonel)"
              placeholderTextColor="#999"
              style={{ ...inputStyle, marginTop: 8 }}
            />

            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", marginTop: 20, marginBottom: 8 }}>
              Besin Değerleri (100g)
            </Text>
            <View style={{ backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14 }}>
              <NutritionRow label="Kalori" value={`${nutrition.calories} kcal`} />
              <NutritionRow label="Protein" value={`${nutrition.protein}g`} />
              <NutritionRow label="Yağ" value={`${nutrition.fat}g`} />
              <NutritionRow label="Doymuş yağ" value={`${nutrition.saturated_fat}g`} />
              <NutritionRow label="Şeker" value={`${nutrition.sugar}g`} />
              <NutritionRow label="Sodyum" value={`${nutrition.sodium}mg`} />
              <NutritionRow label="Lif" value={`${nutrition.fiber}g`} last />
            </View>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                marginTop: 20,
                height: 54,
                borderRadius: 27,
                backgroundColor: "#111",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: saving ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>
                {saving ? "Kaydediliyor..." : "Kaydet & Skoru Gör"}
              </Text>
              {!saving && <Check size={18} color="#FFF" strokeWidth={2.5} />}
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={resetPhoto}
            style={{ marginTop: 20, paddingVertical: 14, borderRadius: 30, backgroundColor: "#C73030", alignItems: "center" }}
          >
            <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Tekrar Fotoğrafla</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: "#111",
  backgroundColor: "#FFF",
};

function NutritionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#F0F0F0",
      }}
    >
      <Text style={{ fontSize: 14, color: "#666" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }}>{value}</Text>
    </View>
  );
}
