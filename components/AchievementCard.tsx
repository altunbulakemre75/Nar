import { View, Text, Pressable } from "react-native";
import { Lock } from "lucide-react-native";
import type { Achievement } from "@/types/achievements";

interface Props {
  achievement: Achievement;
  unlocked: boolean;
  onPress?: () => void;
}

export default function AchievementCard({ achievement, unlocked, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border p-3 items-center"
      style={{
        backgroundColor: unlocked ? "#FFF5F2" : "#F7F5F0",
        borderColor: unlocked ? "#F5D4CA" : "#EEE",
        width: "31%",
        minHeight: 110,
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mb-2"
        style={{
          backgroundColor: unlocked ? "#FFFFFF" : "#EEE",
          opacity: unlocked ? 1 : 0.6,
        }}
      >
        {unlocked ? (
          <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
        ) : (
          <Lock size={18} color="#999" strokeWidth={2} />
        )}
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: unlocked ? "#6B1A1A" : "#999",
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
    </Pressable>
  );
}
