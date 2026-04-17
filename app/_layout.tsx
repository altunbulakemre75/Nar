import "../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/lib/authStore";
import AppErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import NarLogo from "@/components/NarLogo";
import { initAnalytics, track, identifyUser, resetUser } from "@/lib/analytics";

SplashScreen.preventAutoHideAsync();
initAnalytics();

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();

  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
    track("app_opened");
  }, [restoreSession]);

  useEffect(() => {
    if (!initialized) return;

    if (session?.user) {
      identifyUser(session.user.id, { email: session.user.email ?? undefined });
    } else {
      resetUser();
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, initialized, router]);

  return null;
}

export default function RootLayout() {
  const initialized = useAuthStore((s) => s.initialized);

  const [fontsLoaded] = useFonts({
    "PlayfairDisplay-BoldItalic": require("../assets/fonts/PlayfairDisplay-BoldItalic.ttf"),
    "PlayfairDisplay-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <OfflineBanner />
          <AuthGate />
          {initialized ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <AppSplash />
          )}
        </SafeAreaProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

function AppSplash() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFDFB",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <NarLogo size={72} />
      <ActivityIndicator color="#C73030" style={{ marginTop: 32 }} />
    </View>
  );
}
