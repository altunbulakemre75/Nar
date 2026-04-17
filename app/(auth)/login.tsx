import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError("E-posta ve Şifre gerekli");
      return;
    }

    try {
      await signIn(email.trim(), password);
      // Y\u00f6nlendirme _layout.tsx içindeki segment mant\u0131\u011f\u0131 taraf\u0131ndan yap\u0131l\u0131r
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
          {/* Logo */}
          <View className="items-center pt-16 pb-10">
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

          {/* Başlık */}
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 24 }}>
            GiriŞ yap
          </Text>

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
            label="Şifre"
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
            GiriŞ yap
          </Button>

          <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="mt-4 items-center py-2">
            <Text className="text-sm" style={{ color: "#666" }}>
              Şifremi unuttum
            </Text>
          </Pressable>

          <View className="flex-1" />

          <View className="flex-row justify-center items-center pt-6">
            <Text className="text-sm" style={{ color: "#666" }}>
              Hesabın yok mu?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signup")} hitSlop={6}>
              <Text className="text-sm" style={{ color: "#C73030", fontWeight: "600" }}>
                Kayıt ol
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
