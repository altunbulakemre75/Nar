import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import NarAuraLogo from "@/components/NarLogo";
import { useAuthStore } from "@/lib/authStore";
import { useT } from "@/lib/i18n";

export default function LoginScreen() {
  const t = useT();
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
      setLocalError(t("auth.login.credentialsRequired"));
      return;
    }

    try {
      await signIn(email.trim(), password);
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
          <View style={{ alignItems: "center", paddingTop: 56, paddingBottom: 44 }}>
            <NarAuraLogo size={56} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 6 }}>
            {t("auth.login.title")}
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>
            {t("auth.login.subtitle")}
          </Text>

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
            placeholder="********"
          />

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
            hitSlop={8}
            style={{ alignSelf: "flex-end", paddingVertical: 4, marginBottom: 12 }}
          >
            <Text style={{ fontSize: 13, color: "#C73030", fontWeight: "600" }}>
              {t("auth.login.forgot")}
            </Text>
          </Pressable>

          {(localError || error) && (
            <Text style={{ fontSize: 12, marginBottom: 12, color: "#C73030" }}>
              {localError || error}
            </Text>
          )}

          <Button onPress={handleSubmit} loading={loading}>
            {t("auth.login.submit")}
          </Button>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", paddingTop: 24 }}>
            <Text style={{ fontSize: 14, color: "#666" }}>{t("auth.login.noAccount")}</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")} hitSlop={6}>
              <Text style={{ fontSize: 14, color: "#C73030", fontWeight: "700" }}>{t("auth.login.signup")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
