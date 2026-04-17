import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/authStore";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError("E-posta gir");
      return;
    }

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      // hata authStore.error'da
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
          <Pressable onPress={() => router.back()} hitSlop={12} className="pt-2 pb-6 w-10">
            <ChevronLeft size={26} color="#111" strokeWidth={2} />
          </Pressable>

          <Text
            style={{
              fontFamily: "PlayfairDisplay-BoldItalic",
              fontSize: 44,
              color: "#C73030",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Nar
          </Text>

          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8 }}>
            Şifremi unuttum
          </Text>
          <Text className="text-sm mb-8" style={{ color: "#666", lineHeight: 20 }}>
            Kayıtlı e-posta adresine bir sıfırlama bağlantısı göndereceğiz.
          </Text>

          {sent ? (
            <View
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: "#F0FFF4", borderColor: "#A5D65F" }}
            >
              <Text style={{ color: "#2D6A3E", fontWeight: "600", marginBottom: 4 }}>
                Gönderildi ✓
              </Text>
              <Text className="text-sm" style={{ color: "#2D6A3E" }}>
                {email} adresine gelen e-postadaki bağlantıya tıkla.
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="ornek@mail.com"
              />

              {(localError || error) && (
                <Text className="text-xs mb-3" style={{ color: "#C73030" }}>
                  {localError || error}
                </Text>
              )}

              <Button onPress={handleSubmit} loading={loading}>
                Sıfırlama bağlantısı gönder
              </Button>
            </>
          )}

          <View className="flex-1" />

          <Pressable onPress={() => router.replace("/(auth)/login")} className="items-center pt-6 py-2">
            <Text className="text-sm" style={{ color: "#C73030", fontWeight: "600" }}>
              GiriŞ ekranına dön
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
