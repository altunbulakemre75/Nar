import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string; // ISO
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface MealState {
  byDate: Record<string, Meal[]>;
  add: (meal: Omit<Meal, "id" | "created_at">) => void;
  remove: (id: string) => void;
  getToday: () => Meal[];
  getTodayTotals: () => { calories: number; protein: number; fat: number; carbs: number };
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      byDate: {},
      add: (meal) => {
        const today = todayKey();
        const newMeal: Meal = {
          ...meal,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
        };
        const todays = get().byDate[today] ?? [];
        set({ byDate: { ...get().byDate, [today]: [...todays, newMeal] } });
      },
      remove: (id) => {
        const today = todayKey();
        const todays = (get().byDate[today] ?? []).filter((m) => m.id !== id);
        set({ byDate: { ...get().byDate, [today]: todays } });
      },
      getToday: () => get().byDate[todayKey()] ?? [],
      getTodayTotals: () => {
        const meals = get().byDate[todayKey()] ?? [];
        return meals.reduce(
          (acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            fat: acc.fat + m.fat,
            carbs: acc.carbs + m.carbs,
          }),
          { calories: 0, protein: 0, fat: 0, carbs: 0 }
        );
      },
    }),
    {
      name: "nar-meals",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
