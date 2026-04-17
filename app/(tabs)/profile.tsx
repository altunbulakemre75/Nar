import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Settings, ChevronRight, LogOut, Plus, Pencil } from "lucide-react-native";
import { router } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import {
  GOAL_LABELS,
  ACTIVITY_LABELS,
  type Profile as ProfileType,
} from "@/types/database";
import { getCalendarData, getProfileSummary, type DayData } from "@/lib/stats";
import { getUnlockedAchievements } from "@/lib/achievements";
import { ACHIEVEMENTS } from "@/types/achievements";
import DayDetailModal from "@/components/DayDetailModal";
import AchievementCard from "@/components/AchievementCard";
import { scoreColor } from "@/constants/colors";

// Türkçe takvim lokalizasyonu
LocaleConfig.locales.tr = {
  monthNames: [
    "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
    "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
  ],
  monthNamesShort: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],
  dayNames: ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
  dayNamesShort: ["Paz","Pzt","Sal","Çar","Per","Cum","Cts"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

const GENDER_LABELS: Record<string, string> = {
  male: "Erkek",
  female: "Kadın",
  other: "Belirtilmedi",
};

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [name, setName] = useState<string | null>(null);

  const [summary, setSummary] = useState({ totalScans: 0, averageScore: 0, currentStreak: 0 });
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setName((user.user_metadata as any)?.name ?? null);

    const [profRes, s, cal, unl] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      getProfileSummary(),
      getCalendarData(3),
      getUnlockedAchievements(),
    ]);

    if (profRes.data) setProfile(profRes.data as ProfileType);
    setSummary(s);
    setCalendarData(cal);
    setUnlocked(unl);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const handleSignOut = () => {
    Alert.alert("Çıkış yap", "Oturumu kapatmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış yap",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Takvim için markedDates oluştur
  const markedDates: Record<string, any> = {};
  Object.values(calendarData).forEach((d) => {
    if (d.items_count > 0) {
      markedDates[d.date] = {
        marked: true,
        dotColor: scoreColor(d.average_score),
      };
    }
  });
  const todayKey = new Date().toISOString().slice(0, 10);
  markedDates[todayKey] = {
    ...(markedDates[todayKey] ?? {}),
    selected: true,
    selectedColor: "#C73030",
    selectedTextColor: "#FFF",
  };

  const goalLabel = profile?.goal ? GOAL_LABELS[profile.goal] : "Ayarlanmadı";
  const ageLabel = profile?.age ? `${profile.age} yaşında` : "Ayarlanmadı";
  const genderLabel = profile?.gender ? GENDER_LABELS[profile.gender] : "Ayarlanmadı";
  const measureLabel =
    profile?.height_cm && profile?.weight_kg
      ? `${profile.height_cm} cm · ${profile.weight_kg} kg`
      : "Ayarlanmadı";
  const activityLabel = profile?.activity_level
    ? ACTIVITY_LABELS[profile.activity_level]
    : "Ayarlanmadı";

  const unlockedCount = unlocked.length;

  return (
    <SafeAreaView className="flex-1 bg-nar-cream" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Üst bar — Profil başlığı ortalı, ayarlar sağda */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, height: 48, justifyContent: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111", textAlign: "center" }}>
            Profil
          </Text>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={10}
            style={{ position: "absolute", right: 16, top: 12 }}
          >
            <Settings size={24} color="#111" strokeWidth={1.8} />
          </Pressable>
        </View>

        {/* Profil kartı — avatar + yeşil artı rozet + isim + kalem + üye tarihi */}
        <View
          style={{
            marginHorizontal: 16,
            padding: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#EEE",
            backgroundColor: "#FFF",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 64, height: 64, position: "relative" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#EDEDED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={32} color="#888" strokeWidth={1.8} />
            </View>
            {/* Yeşil artı rozet */}
            <Pressable
              onPress={() => router.push("/settings")}
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#FFF",
              }}
            >
              <Plus size={14} color="#FFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={{ marginLeft: 14, flex: 1 }}>
            <Pressable
              onPress={() => router.push("/settings")}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111" }}>
                {name ?? "Adını ekle"}
              </Text>
              <Pencil size={16} color="#22C55E" strokeWidth={2.2} style={{ marginLeft: 8 }} />
            </Pressable>
            <Text style={{ fontSize: 14, color: "#888", marginTop: 2 }}>
              {user?.created_at
                ? `${new Date(user.created_at).getFullYear()} yılından beri üye`
                : "Yeni üye"}
            </Text>
          </View>
        </View>

        {/* Takvim */}
        <View className="mx-4 mt-6">
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>
            Takip edilen ilerleme
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 2, marginBottom: 10 }}>
            {summary.totalScans} tarama · {summary.currentStreak} gün streak
          </Text>
          <View
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
          >
            <Calendar
              firstDay={1}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#666",
                selectedDayBackgroundColor: "#C73030",
                selectedDayTextColor: "#FFF",
                todayTextColor: "#C73030",
                dayTextColor: "#111",
                textDisabledColor: "#CCC",
                dotColor: "#5FB847",
                selectedDotColor: "#FFF",
                arrowColor: "#C73030",
                monthTextColor: "#111",
                indicatorColor: "#C73030",
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
              }}
            />
          </View>
        </View>

        {/* Rozetler */}
        <View className="mx-4 mt-6">
          <View className="flex-row items-baseline justify-between mb-3">
            <Text className="text-sm font-semibold" style={{ color: "#111" }}>
              Rozetler
            </Text>
            <Text className="text-xs" style={{ color: "#666" }}>
              {unlockedCount} / {ACHIEVEMENTS.length}
            </Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {ACHIEVEMENTS.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                unlocked={unlocked.includes(a.id)}
                onPress={() =>
                  Alert.alert(
                    unlocked.includes(a.id)
                      ? `${a.icon} ${a.title}`
                      : `🔒 ${a.title}`,
                    a.description
                  )
                }
              />
            ))}
          </View>
        </View>

        {/* Hakkında */}
        <Text className="px-4 pt-6 pb-2 text-sm font-semibold" style={{ color: "#111" }}>
          Hakkında
        </Text>
        <View
          className="mx-4 rounded-2xl border border-gray-100 overflow-hidden"
          style={{ backgroundColor: "#fff" }}
        >
          <Row label="Hedef" value={goalLabel} />
          <Row label="Yaş" value={ageLabel} />
          <Row label="Cinsiyet" value={genderLabel} />
          <Row label="Boy & Kilo" value={measureLabel} />
          <Row label="Aktivite seviyesi" value={activityLabel} last />
        </View>

        <Pressable
          onPress={() => router.push("/onboarding")}
          className="mx-4 mt-3 py-3 rounded-2xl items-center border"
          style={{ borderColor: "#EEE", backgroundColor: "#FFF" }}
        >
          <Text style={{ color: "#C73030", fontWeight: "600" }}>Profili düzenle</Text>
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          className="mx-4 mt-8 py-4 rounded-2xl flex-row items-center justify-center border"
          style={{ borderColor: "#FFD6D6", backgroundColor: "#FFF5F2" }}
        >
          <LogOut size={18} color="#C73030" strokeWidth={2} />
          <Text className="ml-2 text-base font-semibold" style={{ color: "#C73030" }}>
            Çıkış yap
          </Text>
        </Pressable>
      </ScrollView>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </SafeAreaView>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const isEmpty = value === "Ayarlanmadı";
  return (
    <View
      className={`px-4 py-3 flex-row items-center justify-between ${
        !last ? "border-b border-gray-100" : ""
      }`}
    >
      <View>
        <Text className="text-sm font-medium text-gray-900">{label}</Text>
        <Text className="text-xs mt-0.5" style={{ color: isEmpty ? "#C73030" : "#666" }}>
          {value}
        </Text>
      </View>
      <ChevronRight size={16} color="#999" />
    </View>
  );
}
