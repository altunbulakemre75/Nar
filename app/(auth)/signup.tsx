import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import NarAuraLogo from "@/components/NarLogo";
import { useAuthStore } from "@/lib/authStore";
import { useT } from "@/lib/i18n";

export default function SignupScreen() {
  const t = useT();
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
      setLocalError(t("auth.signup.nameRequired"));
      return;
    }
    if (!email.trim()) {
      setLocalError(t("auth.signup.emailRequired"));
      return;
    }
    if (password.length < 8) {
      setLocalError(t("auth.signup.passwordShort"));
      return;
    }

    try {
      await signUp(email.trim(), password, name.trim());
      router.replace("/onboarding");
    } catch {
      /* authStore.error'da gösterilir */
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", paddingTop: 48, paddingBottom: 36 }}>
            <NarAuraLogo size={52} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 6 }}>
            {t("auth.signup.title")}
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>
            {t("auth.signup.subtitle")}
          </Text>

          <Input
            label={t("auth.signup.name")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder={t("auth.signup.namePlaceholder")}
          />

          <Input
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ornek@mail.com"
          />

          <Input
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t("auth.signup.passwordPlaceholder")}
          />

          {(localError || error) && (
            <Text style={{ fontSize: 12, marginBottom: 12, color: "#C73030" }}>
              {localError || error}
            </Text>
          )}

          <Button onPress={handleSubmit} loading={loading}>
            {t("auth.signup.submit")}
          </Button>

          <Text style={{ fontSize: 12, textAlign: "center", marginTop: 14, color: "#999", lineHeight: 17 }}>
            Kayıt olarak{" "}
            <Text style={{ color: "#6B1A1A", fontWeight: "600" }}>Kullanım Koşulları</Text>
            {" "}ve{" "}
            <Text style={{ color: "#6B1A1A", fontWeight: "600" }}>Gizlilik Politikası</Text>'nı kabul etmiş olursun.
          </Text>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", paddingTop: 24 }}>
            <Text style={{ fontSize: 14, color: "#666" }}>{t("auth.signup.hasAccount")}</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={6}>
              <Text style={{ fontSize: 14, color: "#C73030", fontWeight: "700" }}>{t("auth.signup.login")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
