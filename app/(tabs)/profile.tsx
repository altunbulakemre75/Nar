import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Settings, LogOut, Plus, Pencil, Heart, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/lib/authStore";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useFavoritesStore } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";
import {
  GOAL_LABELS,
  ACTIVITY_LABELS,
  type Profile as ProfileType,
} from "@/types/database";
import { getCalendarData, getProfileSummary, type DayData } from "@/lib/stats";
import DayDetailModal from "@/components/DayDetailModal";
import { scoreColor } from "@/constants/colors";
import { MoodTrend } from "@/components/MoodTrend";
import { ScanTrend } from "@/components/ScanTrend";

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
  const favCount = useFavoritesStore((s) => s.barcodes.length);
  const signOut = useAuthStore((s) => s.signOut);

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [name, setName] = useState<string | null>(null);

  const [summary, setSummary] = useState({ totalScans: 0, averageScore: 0, currentStreak: 0 });
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setName((user.user_metadata as any)?.name ?? null);

    const [profRes, s, cal] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      getProfileSummary(),
      getCalendarData(3),
    ]);

    if (profRes.data) {
      const p = profRes.data as ProfileType;
      setProfile(p);
      // Onboarding store'u mevcut profille hydrate et — düzenlerken boş gelmesin
      useOnboardingStore.getState().hydrate({
        goal: p.goal,
        age: p.age,
        gender: p.gender,
        height_cm: p.height_cm,
        weight_kg: p.weight_kg,
        activity_level: p.activity_level,
        health_conditions: p.health_conditions ?? [],
        allergies: p.allergies ?? [],
        dietary_restrictions: p.dietary_restrictions ?? [],
      });
    }
    setSummary(s);
    setCalendarData(cal);
  }, [user]);

  // Tek kaynak: useFocusEffect mount + her focus'ta çalışır (useEffect kaldırıldı).
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

  // Takvim için markedDates (memoized — her render'da yeniden üretme)
  const markedDates = useMemo(() => {
    const md: Record<string, any> = {};
    Object.values(calendarData).forEach((d) => {
      if (d.items_count > 0) {
        md[d.date] = { marked: true, dotColor: scoreColor(d.average_score) };
      }
    });
    const todayKey = new Date().toISOString().slice(0, 10);
    md[todayKey] = {
      ...(md[todayKey] ?? {}),
      selected: true,
      selectedColor: "#C73030",
      selectedTextColor: "#FFF",
    };
    return md;
  }, [calendarData]);

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

  const waterLabel = (() => {
    const g = profile?.water_glasses;
    if (g == null) return "Ayarlanmadı";
    if (g >= 8) return "Harika";
    if (g >= 5) return "İyi";
    if (g >= 1) return "Yetersiz";
    return "Ayarlanmadı";
  })();

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
            padding: 21,
            borderRadius: 23,
            borderWidth: 1,
            borderColor: "#EEE",
            backgroundColor: "#FFF",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 85, height: 85, position: "relative" }}>
            <View
              style={{
                width: 85,
                height: 85,
                borderRadius: 42.5,
                backgroundColor: "#EDEDED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={42} color="#888" strokeWidth={1.8} />
            </View>
            {/* Yeşil artı rozet */}
            <Pressable
              onPress={() => router.push("/settings")}
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 29,
                height: 29,
                borderRadius: 14.5,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#FFF",
              }}
            >
              <Plus size={17} color="#FFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={{ marginLeft: 18, flex: 1 }}>
            <Pressable
              onPress={() => router.push("/settings")}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ fontSize: 26, fontWeight: "700", color: "#111" }}>
                {name ?? "Adını ekle"}
              </Text>
              <Pencil size={21} color="#22C55E" strokeWidth={2.2} style={{ marginLeft: 9 }} />
            </Pressable>
            <Text style={{ fontSize: 18, color: "#888", marginTop: 3 }}>
              {user?.created_at
                ? `${new Date(user.created_at).getFullYear()} yılından beri üye`
                : "Yeni üye"}
            </Text>
          </View>
        </View>

        {/* 7 günlük trendler */}
        <ScanTrend />
        <MoodTrend />

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

        {/* Favoriler kısayolu */}
        <Pressable
          onPress={() => router.push("/favorites")}
          style={{
            marginHorizontal: 16,
            marginTop: 22,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#FFF",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center" }}>
            <Heart size={18} color="#C73030" strokeWidth={2} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>Favorilerim</Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {favCount > 0 ? `${favCount} ürün` : "Henüz favori eklemedin"}
            </Text>
          </View>
          <ChevronRight size={18} color="#999" />
        </Pressable>

        {/* Hakkında */}
        <Text style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 10, fontSize: 22, fontWeight: "700", color: "#111" }}>
          Hakkında
        </Text>
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            overflow: "hidden",
            backgroundColor: "#FFF",
          }}
        >
          <FieldRow label="Hedef" value={goalLabel} onEdit={() => router.push("/onboarding/goal")} />
          <FieldRow label="Yaş" value={ageLabel} onEdit={() => router.push("/onboarding/age")} />
          <FieldRow label="Cinsiyet" value={genderLabel} onEdit={() => router.push("/onboarding/gender")} />
          <FieldRow label="Boy & Kilo" value={measureLabel} onEdit={() => router.push("/onboarding/measurements")} />
          <FieldRow label="Günlük Su Tüketimi" value={waterLabel} onEdit={async () => {
            if (!user) return;
            Alert.alert(
              "Günlük su tüketimi",
              "Ortalama kaç bardak su içiyorsun?",
              [
                { text: "Az (1-4)", onPress: () => updateWater(user.id, 3, fetchAll) },
                { text: "Orta (5-6)", onPress: () => updateWater(user.id, 6, fetchAll) },
                { text: "İyi (7-8)", onPress: () => updateWater(user.id, 8, fetchAll) },
                { text: "Harika (9+)", onPress: () => updateWater(user.id, 10, fetchAll) },
                { text: "Vazgeç", style: "cancel" },
              ]
            );
          }} />
          <FieldRow label="Aktivite Seviyesi" value={activityLabel} onEdit={() => router.push("/onboarding/activity")} last />
        </View>

        {/* Tercihler */}
        <Text style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 10, fontSize: 22, fontWeight: "700", color: "#111" }}>
          Tercihler
        </Text>

        <TagGroup
          title="Diyet Kısıtlamaları"
          tags={profile?.dietary_restrictions ?? []}
          emptyText="Diyet kısıtlaması yok"
          onEdit={() =>
            router.push({ pathname: "/settings/edit-preferences", params: { field: "dietary_restrictions" } })
          }
        />

        <View style={{ height: 10 }} />

        <TagGroup
          title="Sağlık Durumları"
          tags={profile?.health_conditions ?? []}
          emptyText="Sağlık durumu belirtilmedi"
          onEdit={() =>
            router.push({ pathname: "/settings/edit-preferences", params: { field: "health_conditions" } })
          }
        />

        <View style={{ height: 10 }} />

        <TagGroup
          title="Alerjiler"
          tags={profile?.allergies ?? []}
          emptyText="Alerji yok"
          onEdit={() =>
            router.push({ pathname: "/settings/edit-preferences", params: { field: "allergies" } })
          }
        />

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

async function updateWater(userId: string, glasses: number, refresh: () => void) {
  await supabase.from("profiles").update({ water_glasses: glasses }).eq("id", userId);
  refresh();
}

function FieldRow({
  label,
  value,
  onEdit,
  last = false,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  last?: boolean;
}) {
  const isEmpty = value === "Ayarlanmadı";
  return (
    <Pressable
      onPress={onEdit}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F0F0F0",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>{label}</Text>
        <Text
          style={{
            fontSize: 14,
            marginTop: 4,
            color: isEmpty ? "#DC2626" : "#333",
            fontStyle: isEmpty ? "italic" : "normal",
          }}
        >
          {value}
        </Text>
      </View>
      <Pencil size={16} color="#888" strokeWidth={1.8} />
    </Pressable>
  );
}

function TagGroup({
  title,
  tags: tagsInput,
  emptyText,
  onEdit,
}: {
  title: string;
  tags: string[] | null | undefined;
  emptyText: string;
  onEdit?: () => void;
}) {
  const tags = Array.isArray(tagsInput) ? tagsInput : [];
  return (
    <Pressable
      onPress={onEdit}
      style={{
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFF",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: tags.length > 0 ? 10 : 6 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>{title}</Text>
        <Pencil size={14} color="#888" strokeWidth={1.8} style={{ marginLeft: 8 }} />
      </View>
      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {tags.map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "#F3F4F6",
              }}
            >
              <Text style={{ fontSize: 13, color: "#374151" }}>{t}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>{emptyText}</Text>
      )}
    </Pressable>
  );
}
