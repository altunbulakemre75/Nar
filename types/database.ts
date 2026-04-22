export type Goal =
  | "lose_weight"
  | "gain_muscle"
  | "clear_skin"
  | "reduce_bloat"
  | "better_sleep"
  | "more_energy"
  | "face_sculpt";

export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "Kilo vermek",
  gain_muscle: "Kas kazanmak",
  clear_skin: "Cilt temizliği",
  reduce_bloat: "Şişkinliği azaltmak",
  better_sleep: "Daha iyi uyku",
  more_energy: "Daha fazla enerji",
  face_sculpt: "Yüz şekillendirme",
};

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Hareketsiz",
  light: "Hafif aktif",
  moderate: "Orta aktif",
  active: "Aktif",
  very_active: "Çok aktif",
};

export type NarciPersonality = "anne" | "muhendis" | "yol_arkadasi";

export const PERSONALITY_LABELS: Record<NarciPersonality, string> = {
  anne: "Anne Modu",
  muhendis: "Mühendis Modu",
  yol_arkadasi: "Yol Arkadaşı",
};

export const PERSONALITY_DESCRIPTIONS: Record<NarciPersonality, string> = {
  anne: "Empatik, koruyucu, yargılamaz. Türk annesi gibi sevgiyle konuşur.",
  muhendis: "Verisel, rasyonel. Kalori, protein, glisemik indeks — sayılar odaklı.",
  yol_arkadasi: "Samimi arkadaşın. Günlük dil, bazen şaka, hep yanında.",
};

export interface Profile {
  id: string;
  name: string | null;
  goal: Goal | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  water_glasses: number | null;
  dietary_restrictions: string[];
  health_conditions: string[];
  allergies: string[];
  narci_personality?: NarciPersonality;
  updated_at?: string;
}

export interface Nutrition {
  calories: number;
  sugar: number;
  added_sugar?: number;
  saturated_fat: number;
  fat: number;
  sodium: number;
  fiber: number;
  protein: number;
  serving_size_g: number;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  ingredients: string | null;
  nutrition: Nutrition | null;
  additives: string[];
  is_organic: boolean;
  country: string;
  verified: boolean;
  scan_count?: number;
  sold_in_turkey?: boolean;
  origin_country?: string | null;
  has_complete_data?: boolean;
}

export interface Scan {
  id: string;
  user_id: string;
  product_id: number;
  score: number;
  logged_in_daily: boolean;
  scanned_at: string;
}
