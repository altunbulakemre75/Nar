export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;       // emoji
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_scan",     title: "İlk Adım",            description: "İlk ürününü tara",                        icon: "🎯" },
  { id: "streak_7",       title: "Bir Hafta",           description: "7 gün üst üste tarama yap",               icon: "🔥" },
  { id: "streak_30",      title: "Bir Ay",              description: "30 gün üst üste tarama yap",              icon: "🏆" },
  { id: "scan_100",       title: "Yüzbaşı",             description: "Toplam 100 tarama yap",                   icon: "💯" },
  { id: "score_80",       title: "Yüksek Skor",         description: "Bir ürünü tarayıp 80+ al",                icon: "⭐" },
  { id: "variety",        title: "Çeşitli Beslenen",    description: "10 farklı kategoride ürün tara",          icon: "🌈" },
  { id: "night_owl",      title: "Gece Kuşu",           description: "Gece 22-02 arası 5 tarama yap",           icon: "🦉" },
  { id: "early_bird",     title: "Erken Kalkan",        description: "Sabah 06-08 arası 5 tarama yap",          icon: "☀️" },
  { id: "ramadan_champ",  title: "Ramazan Şampiyonu",   description: "Ramazan ayında 20+ gün tarama yap",       icon: "🌙" },
  { id: "goal_crusher",   title: "Hedef Avcısı",        description: "Hedefine uygun 50 ürün tara (skor 65+)",  icon: "🏹" },
];

export interface UserAchievement {
  id: number;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
