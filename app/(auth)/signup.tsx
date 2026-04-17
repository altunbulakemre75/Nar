import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/authStore";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();

    if (!name.trim()) {
      setLocalError("Adını gir");
      return;
    }
    if (!email.trim()) {
      setLocalError("E-posta gir");
      return;
    }
    if (password.length < 8) {
      setLocalError("Şifre en az 8 karakter olmalı");
      return;
    }

    try {
      await signUp(email.trim(), password, name.trim());
      // YENİ kullanıcı: profil bilgileri yok, onboarding'e yönlendir
      router.replace("/onboarding");
    } catch {
      // hata authStore.error'da g\u00f6sterilir
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center pt-12 pb-8">
            <Text
              style={{
                fontFamily: "PlayfairDisplay-BoldItalic",
                fontSize: 56,
                color: "#C73030",
              }}
            >
              Nar
            </Text>
            <Text className="mt-2 text-sm" style={{ color: "#6B1A1A" }}>
              Ne yediğini bil
            </Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 24 }}>
            Hesabını oluştur
          </Text>

          <Input
            label="Adın"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Ad Soyad"
          />

          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ornek@mail.com"
          />

          <Input
            label="Şifre (en az 8 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
          />

          {(localError || error) && (
            <Text className="text-xs mb-3" style={{ color: "#C73030" }}>
              {localError || error}
            </Text>
          )}

          <Button onPress={handleSubmit} loading={loading}>
            Kayıt ol
          </Button>

          <Text className="text-xs text-center mt-4" style={{ color: "#999", lineHeight: 16 }}>
            Kayıt olarak{" "}
            <Text style={{ color: "#6B1A1A", fontWeight: "500" }}>Kullanım Koşulları</Text>
            {" "}ve{" "}
            <Text style={{ color: "#6B1A1A", fontWeight: "500" }}>Gizlilik Politikası</Text>'nı
            kabul etmiŞ olursun.
          </Text>

          <View className="flex-1" />

          <View className="flex-row justify-center items-center pt-6">
            <Text className="text-sm" style={{ color: "#666" }}>
              Zaten hesabın var mı?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={6}>
              <Text className="text-sm" style={{ color: "#C73030", fontWeight: "600" }}>
                GiriŞ yap
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
