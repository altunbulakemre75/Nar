import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useMoodStore, MOOD_EMOJIS, MOOD_LABELS, type Mood } from "@/lib/moodStore";

const MOODS: Mood[] = ["great", "good", "ok", "low", "tired"];

export function MoodCard() {
  const current = useMoodStore((s) => s.getToday());
  const setToday = useMoodStore((s) => s.setToday);

  const handleSelect = (mood: Mood) => {
    Haptics.selectionAsync();
    setToday(mood);
  };

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>
          Bugün nasıl hissediyorsun?
        </Text>
        {current && (
          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {MOOD_EMOJIS[current]} {MOOD_LABELS[current]}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {MOODS.map((mood) => {
          const selected = current === mood;
          return (
            <Pressable
              key={mood}
              onPress={() => handleSelect(mood)}
              hitSlop={4}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected ? "#FFF5F2" : "#F7F7F8",
                borderWidth: selected ? 2 : 0,
                borderColor: "#C73030",
              }}
            >
              <Text style={{ fontSize: 28 }}>{MOOD_EMOJIS[mood]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
