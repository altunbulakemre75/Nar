import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface WaterState {
  date: string;
  glasses: number;
  add: () => void;
  remove: () => void;
  reset: () => void;
  getToday: () => number;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      date: todayKey(),
      glasses: 0,
      add: () => {
        const today = todayKey();
        const { date, glasses } = get();
        if (date !== today) {
          // Gün değişti, sıfırdan başla
          set({ date: today, glasses: 1 });
        } else {
          set({ glasses: glasses + 1 });
        }
      },
      remove: () => {
        const today = todayKey();
        const { date, glasses } = get();
        if (date !== today) {
          set({ date: today, glasses: 0 });
        } else if (glasses > 0) {
          set({ glasses: glasses - 1 });
        }
      },
      reset: () => set({ date: todayKey(), glasses: 0 }),
      getToday: () => {
        const today = todayKey();
        const { date, glasses } = get();
        return date === today ? glasses : 0;
      },
    }),
    {
      name: "nar-water",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
