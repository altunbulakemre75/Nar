import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Sparkles, Check, Camera, Image as ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { estimateMeal, estimateMealFromPhoto, type MealEstimate } from "@/lib/mealEstimator";
import { useMealStore } from "@/lib/mealStore";

export default function AddMealScreen() {
  const [text, setText] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<MealEstimate | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const add = useMealStore((s) => s.add);

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", useCamera ? "Kamera izni gerekli." : "Galeri izni gerekli.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
          allowsEditing: false,
        });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Hata", "Fotoğraf okunamadı, tekrar dene.");
      return;
    }

    setPhotoUri(asset.uri);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await estimateMealFromPhoto(asset.base64, "image/jpeg");
      setEstimate(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Fotoğraf analizi başarısız", e?.message ?? "Tekrar dene.");
    } finally {
      setEstimating(false);
    }
  };

  const runEstimate = async () => {
    if (!text.trim() || estimating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstimating(true);
    setEstimate(null);
    try {
      const result = await estimateMeal(text.trim());
      setEstimate(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Tahmin yapılamadı", e?.message ?? "Tekrar dene.");
    } finally {
      setEstimating(false);
    }
  };

  const save = () => {
    if (!estimate) return;
    add(estimate);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Top bar */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={24} color="#111" strokeWidth={2.2} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111", flex: 1, textAlign: "center", marginRight: 40 }}>
            Yemek ekle
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 10, lineHeight: 20 }}>
            Fotoğraf çek ya da yazarak anlat — Aura tahmin yapsın.
          </Text>

          {/* Fotoğraf butonları */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <Pressable
              onPress={() => pickImage(true)}
              disabled={estimating}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: "#F4F4F5",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Camera size={18} color="#111" strokeWidth={2} />
              <Text style={{ color: "#111", fontSize: 14, fontWeight: "600" }}>Fotoğraf çek</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage(false)}
              disabled={estimating}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: "#F4F4F5",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ImageIcon size={18} color="#111" strokeWidth={2} />
              <Text style={{ color: "#111", fontSize: 14, fontWeight: "600" }}>Galeri</Text>
            </Pressable>
          </View>

          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: 180, borderRadius: 14, marginBottom: 14 }}
              resizeMode="cover"
            />
          )}

          <Text style={{ fontSize: 13, color: "#888", marginBottom: 8, textAlign: "center" }}>
            — ya da yazarak anlat —
          </Text>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ör: 1 tabak mercimek çorbası, 2 dilim ekmek"
            placeholderTextColor="#AAA"
            multiline
            maxLength={300}
            style={{
              minHeight: 100,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#F4F4F5",
              fontSize: 15,
              color: "#111",
              textAlignVertical: "top",
            }}
          />

          <Pressable
            onPress={runEstimate}
            disabled={!text.trim() || estimating}
            style={{
              marginTop: 12,
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: text.trim() && !estimating ? "#C73030" : "#E5E5E7",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {estimating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Sparkles size={18} color="#FFF" />
            )}
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
              {estimating ? "Tahmin yapılıyor…" : "Aura ile tahmin et"}
            </Text>
          </Pressable>

          {estimate && (
            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: "#FFF5F2", borderWidth: 1, borderColor: "#FFD7CC" }}>
              <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Tahmini</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 14 }}>{estimate.name}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <MacroCell label="Kalori" value={`${estimate.calories}`} unit="kcal" />
                <MacroCell label="Protein" value={`${estimate.protein}`} unit="g" />
                <MacroCell label="Yağ" value={`${estimate.fat}`} unit="g" />
                <MacroCell label="Karb" value={`${estimate.carbs}`} unit="g" />
              </View>

              <Text style={{ fontSize: 11, color: "#888", marginTop: 12, textAlign: "center" }}>
                Değerler yaklaşıktır (±%15-20). Porsiyon farkı büyük etki eder.
              </Text>

              <Pressable
                onPress={save}
                style={{
                  marginTop: 14,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: "#111",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Check size={16} color="#FFF" strokeWidth={2.5} />
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>
                  Günlüğüme ekle
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#C73030" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{unit}</Text>
      <Text style={{ fontSize: 11, color: "#555", marginTop: 2, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}
