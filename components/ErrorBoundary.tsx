import { ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary as REB, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, RotateCcw } from "lucide-react-native";

interface Props {
  children: ReactNode;
}

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const err = error as Error;
  const isDev = __DEV__;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFDFB" }}>
      <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#FFF5F2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <AlertTriangle size={36} color="#C73030" strokeWidth={1.6} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8, textAlign: "center" }}>
          Beklenmedik bir hata oluştu
        </Text>
        <Text style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 32 }}>
          Bir şeyler ters gitti. Tekrar denemeyi deneyelim.
        </Text>

        <Pressable
          onPress={resetErrorBoundary}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#C73030",
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 999,
          }}
        >
          <RotateCcw size={18} color="#FFF" strokeWidth={2} />
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600", marginLeft: 8 }}>
            Tekrar dene
          </Text>
        </Pressable>

        {isDev && (
          <View
            style={{
              marginTop: 32,
              padding: 12,
              backgroundColor: "#F5F5F5",
              borderRadius: 12,
              width: "100%",
              maxHeight: 200,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#666", marginBottom: 4 }}>
              DEV - teknik detay
            </Text>
            <ScrollView>
              <Text style={{ fontSize: 11, color: "#444", fontFamily: "Courier" }}>
                {err.message}
                {err.stack ? `\n\n${err.stack.split("\n").slice(0, 8).join("\n")}` : ""}
              </Text>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function AppErrorBoundary({ children }: Props) {
  return (
    <REB
      FallbackComponent={Fallback}
      onError={(error, info) => {
        // Prod'da: Sentry.captureException(error, { extra: info })
        const err = error as Error;
        console.error("ErrorBoundary yakaladı:", err.message, info);
      }}
    >
      {children}
    </REB>
  );
}
