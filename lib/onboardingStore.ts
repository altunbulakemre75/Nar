import { create } from "zustand";
import type { ActivityLevel, Goal } from "@/types/database";

export type Gender = "male" | "female" | "other";

export interface OnboardingState {
  goal: Goal | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  health_conditions: string[];
  allergies: string[];
  dietary_restrictions: string[];

  setGoal: (goal: Goal) => void;
  setAge: (age: number) => void;
  setGender: (gender: Gender) => void;
  setHeight: (height: number) => void;
  setWeight: (weight: number) => void;
  setActivityLevel: (level: ActivityLevel) => void;
  toggleHealthCondition: (value: string) => void;
  toggleAllergy: (value: string) => void;
  toggleDietaryRestriction: (value: string) => void;

  hydrate: (p: Partial<Omit<OnboardingState, "setGoal" | "setAge" | "setGender" | "setHeight" | "setWeight" | "setActivityLevel" | "toggleHealthCondition" | "toggleAllergy" | "toggleDietaryRestriction" | "reset" | "hydrate">>) => void;
  reset: () => void;
}

const initialState = {
  goal: null,
  age: null,
  gender: null,
  height_cm: null,
  weight_kg: null,
  activity_level: null,
  health_conditions: [],
  allergies: [],
  dietary_restrictions: [],
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setGoal: (goal) => set({ goal }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setHeight: (height_cm) => set({ height_cm }),
  setWeight: (weight_kg) => set({ weight_kg }),
  setActivityLevel: (activity_level) => set({ activity_level }),

  toggleHealthCondition: (value) =>
    set((s) => ({ health_conditions: toggle(s.health_conditions, value) })),
  toggleAllergy: (value) =>
    set((s) => ({ allergies: toggle(s.allergies, value) })),
  toggleDietaryRestriction: (value) =>
    set((s) => ({ dietary_restrictions: toggle(s.dietary_restrictions, value) })),

  hydrate: (p) =>
    set((s) => ({
      goal: p.goal ?? s.goal,
      age: p.age ?? s.age,
      gender: p.gender ?? s.gender,
      height_cm: p.height_cm ?? s.height_cm,
      weight_kg: p.weight_kg ?? s.weight_kg,
      activity_level: p.activity_level ?? s.activity_level,
      health_conditions: p.health_conditions ?? s.health_conditions,
      allergies: p.allergies ?? s.allergies,
      dietary_restrictions: p.dietary_restrictions ?? s.dietary_restrictions,
    })),

  reset: () => set(initialState),
}));
