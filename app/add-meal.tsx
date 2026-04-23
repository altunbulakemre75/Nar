import { useEffect, useRef, useState } from "react";
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

type HiddenExtra = {
  id: string;
  label: string;
  emoji: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

const HIDDEN_EXTRAS: HiddenExtra[] = [
  { id: "butter", label: "Tereyağı", emoji: "🧈", calories: 80, protein: 0, fat: 9, carbs: 0 },
  { id: "oil", label: "Zeytinyağı", emoji: "🫒", calories: 100, protein: 0, fat: 11, carbs: 0 },
  { id: "sauce", label: "Sos / Mayonez", emoji: "🥗", calories: 120, protein: 0, fat: 13, carbs: 1 },
  { id: "cheese", label: "Ekstra peynir", emoji: "🧀", calories: 60, protein: 4, fat: 5, carbs: 0 },
  { id: "bread", label: "Ekmek dilimi", emoji: "🍞", calories: 80, protein: 3, fat: 1, carbs: 15 },
  { id: "sugar", label: "Şeker / bal", emoji: "🍯", calories: 50, protein: 0, fat: 0, carbs: 13 },
];

export default function AddMealScreen() {
  const [text, setText] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<MealEstimate | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const add = useMealStore((s) => s.add);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const toggleExtra = (id: string) => {
    Haptics.selectionAsync();
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Görünmez kalorilerle birleşik tahmin
  const finalEstimate = estimate
    ? HIDDEN_EXTRAS.filter((e) => extras.includes(e.id)).reduce(
        (acc, e) => ({
          ...acc,
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          carbs: acc.carbs + e.carbs,
        }),
        { ...estimate }
      )
    : null;

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
      if (!mountedRef.current) return;
      handleNewEstimate(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (!mountedRef.current) return;
      Alert.alert("Fotoğraf analizi başarısız", e?.message ?? "Tekrar dene.");
    } finally {
      if (mountedRef.current) setEstimating(false);
    }
  };

  const runEstimate = async () => {
    const trimmed = text.trim();
    if (!trimmed || estimating) return;
    if (trimmed.length < 3) {
      Alert.alert("Çok kısa", "Daha ayrıntılı yaz — en az 3 karakter.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstimating(true);
    setEstimate(null);
    try {
      const result = await estimateMeal(text.trim());
      if (!mountedRef.current) return;
      handleNewEstimate(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (!mountedRef.current) return;
      Alert.alert("Tahmin yapılamadı", e?.message ?? "Tekrar dene.");
    } finally {
      if (mountedRef.current) setEstimating(false);
    }
  };

  const save = () => {
    if (!finalEstimate) return;
    add(finalEstimate);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  // Yeni tahmin her geldiğinde extras'ı sıfırla
  const handleNewEstimate = (e: MealEstimate) => {
    setEstimate(e);
    setExtras([]);
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

          {estimate && finalEstimate && (
            <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: "#FFF5F2", borderWidth: 1, borderColor: "#FFD7CC" }}>
              <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Tahmini</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 14 }}>{estimate.name}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <MacroCell label="Kalori" value={`${finalEstimate.calories}`} unit="kcal" />
                <MacroCell label="Protein" value={`${finalEstimate.protein}`} unit="g" />
                <MacroCell label="Yağ" value={`${finalEstimate.fat}`} unit="g" />
                <MacroCell label="Karb" value={`${finalEstimate.carbs}`} unit="g" />
              </View>

              <Text style={{ fontSize: 11, color: "#888", marginTop: 12, textAlign: "center" }}>
                Değerler yaklaşıktır (±%15-20). Porsiyon farkı büyük etki eder.
              </Text>

              {/* Görünmez kalori */}
              <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#FFD7CC" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#111", marginBottom: 4 }}>
                  Görünmez kalori eklendi mi?
                </Text>
                <Text style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                  Yağ, sos, ekmek gibi ek şeyleri işaretle — tahmine eklensin.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {HIDDEN_EXTRAS.map((e) => {
                    const on = extras.includes(e.id);
                    return (
                      <Pressable
                        key={e.id}
                        onPress={() => toggleExtra(e.id)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: on ? "#C73030" : "#FFF",
                          borderWidth: 1,
                          borderColor: on ? "#C73030" : "#E5D5C5",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>{e.emoji}</Text>
                        <Text style={{ fontSize: 12, fontWeight: "500", color: on ? "#FFF" : "#333" }}>
                          {e.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: on ? "rgba(255,255,255,0.8)" : "#888" }}>
                          +{e.calories}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={save}
                style={{
                  marginTop: 18,
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
                  Günlüğüme ekle ({finalEstimate.calories} kcal)
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
