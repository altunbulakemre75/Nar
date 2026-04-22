import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Mood = "great" | "good" | "ok" | "low" | "tired";

export const MOOD_EMOJIS: Record<Mood, string> = {
  great: "😊",
  good: "🙂",
  ok: "😐",
  low: "😔",
  tired: "😫",
};

export const MOOD_LABELS: Record<Mood, string> = {
  great: "Harika",
  good: "İyi",
  ok: "Normal",
  low: "Düşük",
  tired: "Yorgun",
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface MoodState {
  // Son 30 günü date → mood ile tut
  history: Record<string, Mood>;
  setToday: (mood: Mood) => void;
  getToday: () => Mood | null;
  clearToday: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      history: {},
      setToday: (mood) => {
        const today = todayKey();
        const history = { ...get().history, [today]: mood };
        // Son 30 günü tut, gerisini bırak
        const keys = Object.keys(history).sort().slice(-30);
        const trimmed: Record<string, Mood> = {};
        for (const k of keys) trimmed[k] = history[k];
        set({ history: trimmed });
      },
      getToday: () => get().history[todayKey()] ?? null,
      clearToday: () => {
        const today = todayKey();
        const next = { ...get().history };
        delete next[today];
        set({ history: next });
      },
    }),
    {
      name: "nar-mood",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
