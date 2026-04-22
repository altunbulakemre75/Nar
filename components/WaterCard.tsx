import { View, Text, Pressable } from "react-native";
import { Droplet, Plus, Minus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useWaterStore } from "@/lib/waterStore";

const DEFAULT_TARGET = 8;

export function WaterCard({ target = DEFAULT_TARGET }: { target?: number }) {
  const glasses = useWaterStore((s) => s.getToday());
  const add = useWaterStore((s) => s.add);
  const remove = useWaterStore((s) => s.remove);

  const progress = Math.min(glasses / target, 1);
  const reached = glasses >= target;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#E0F2FE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Droplet size={18} color="#0284C7" fill="#0284C7" strokeWidth={0} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>Su takibi</Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {reached ? "Hedef tamam! 🎉" : `${glasses} / ${target} bardak`}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            remove();
          }}
          disabled={glasses === 0}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: glasses === 0 ? "#F5F5F5" : "#F0F4F8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Minus size={18} color={glasses === 0 ? "#CCC" : "#0284C7"} strokeWidth={2.5} />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            add();
          }}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#0284C7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={18} color="#FFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 8,
          backgroundColor: "#F0F4F8",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: reached ? "#10B981" : "#0284C7",
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}
