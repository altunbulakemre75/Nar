import { View, Text } from "react-native";
import { Eye } from "lucide-react-native";
import type { BasiretResult } from "@/lib/basiret";

const COLORS = {
  yesil: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
  sari: { bg: "#FFF9E6", border: "#FFC107", text: "#F57F17" },
  turuncu: { bg: "#FFF3E0", border: "#FF9800", text: "#E65100" },
} as const;

export function BasiretCard({ result }: { result: BasiretResult }) {
  const c = COLORS[result.level];

  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderLeftWidth: 4,
        borderLeftColor: c.border,
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Eye size={16} color={c.text} strokeWidth={2} />
        <Text style={{ fontSize: 13, fontWeight: "700", color: c.text, letterSpacing: 0.3 }}>
          BASİRET {result.icon}
        </Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F1F1F", marginBottom: result.suggestion ? 4 : 0 }}>
        {result.message}
      </Text>

      {result.suggestion && (
        <Text style={{ fontSize: 14, color: "#444", lineHeight: 20 }}>
          {result.suggestion}
        </Text>
      )}
    </View>
  );
}
