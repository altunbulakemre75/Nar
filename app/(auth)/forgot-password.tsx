import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import NarAuraLogo from "@/components/NarLogo";
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
      /* authStore.error'da gösterilir */
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingTop: 8, paddingBottom: 20, width: 40 }}>
            <ChevronLeft size={26} color="#111" strokeWidth={2} />
          </Pressable>

          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <NarAuraLogo size={44} showTagline={false} />
          </View>

          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 8 }}>
            Şifremi unuttum
          </Text>
          <Text style={{ fontSize: 14, marginBottom: 28, color: "#666", lineHeight: 20 }}>
            Kayıtlı e-posta adresine bir sıfırlama bağlantısı göndereceğiz.
          </Text>

          {sent ? (
            <View style={{ borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: "#F0FFF4", borderColor: "#A5D65F" }}>
              <Text style={{ color: "#2D6A3E", fontWeight: "700", marginBottom: 4 }}>
                Gönderildi ✓
              </Text>
              <Text style={{ fontSize: 14, color: "#2D6A3E" }}>
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
                <Text style={{ fontSize: 12, marginBottom: 12, color: "#C73030" }}>
                  {localError || error}
                </Text>
              )}

              <Button onPress={handleSubmit} loading={loading}>
                Sıfırlama bağlantısı gönder
              </Button>
            </>
          )}

          <View style={{ flex: 1 }} />

          <Pressable onPress={() => router.replace("/(auth)/login")} style={{ alignItems: "center", paddingTop: 24, paddingBottom: 8 }}>
            <Text style={{ fontSize: 14, color: "#C73030", fontWeight: "700" }}>Giriş ekranına dön</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
