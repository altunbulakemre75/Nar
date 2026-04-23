import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Download, FileText, Eye, Trash2 } from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { useWaterStore } from "@/lib/waterStore";
import { useMoodStore } from "@/lib/moodStore";
import { useMealStore } from "@/lib/mealStore";

export default function MyDataScreen() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    scans: 0,
    dailyLogs: 0,
    achievements: 0,
    hasProfile: false,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [scansRes, logsRes, achRes, profRes] = await Promise.all([
        supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("daily_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
      ]);
      if (!mountedRef.current) return;
      setStats({
        scans: scansRes.count ?? 0,
        dailyLogs: logsRes.count ?? 0,
        achievements: achRes.count ?? 0,
        hasProfile: !!profRes.data,
      });
      setLoading(false);
    })();
  }, [user]);

  const exportJSON = async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const [profile, scans, achievements, dailyLogs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("scans").select("*, product:products(name, brand, barcode)").eq("user_id", user.id),
        supabase.from("user_achievements").select("*").eq("user_id", user.id),
        supabase.from("daily_logs").select("*").eq("user_id", user.id),
      ]);

      const waterState = useWaterStore.getState();
      const moodState = useMoodStore.getState();
      const mealState = useMealStore.getState();

      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: "Nar Aura v0.1.0",
        user: { id: user.id, email: user.email },
        profile: profile.data,
        scans: scans.data,
        daily_logs: dailyLogs.data,
        achievements: achievements.data,
        water: { date: waterState.date, glasses: waterState.glasses },
        mood_history: moodState.history,
        meals: mealState.byDate,
      };

      await Share.share({
        title: "Nar Aura — tüm verilerim (JSON)",
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert("Hata", "JSON dışa aktarılamadı.");
    }
    if (mountedRef.current) setExporting(false);
  };

  const exportCSV = async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const { data: scans } = await supabase
        .from("scans")
        .select("scanned_at, score, product:products(name, brand, barcode, category)")
        .eq("user_id", user.id)
        .order("scanned_at", { ascending: false });

      const header = "Tarih,Ürün,Marka,Kategori,Barkod,Skor";
      const rows = (scans ?? []).map((s: any) => {
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        return [
          esc(s.scanned_at),
          esc(s.product?.name),
          esc(s.product?.brand),
          esc(s.product?.category),
          esc(s.product?.barcode),
          s.score ?? "",
        ].join(",");
      });
      const csv = [header, ...rows].join("\n");

      await Share.share({
        title: "Nar Aura — taramalarım (CSV)",
        message: csv,
      });
    } catch {
      Alert.alert("Hata", "CSV dışa aktarılamadı.");
    }
    if (mountedRef.current) setExporting(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2EFEA" }}>
        <ActivityIndicator color="#C73030" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2EFEA" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={20} color="#1C1C1E" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        <Text style={{ fontSize: 34, fontWeight: "700", color: "#1C1C1E", letterSpacing: -0.8, lineHeight: 40, marginTop: 8, marginBottom: 8 }}>
          Verilerim
        </Text>
        <Text style={{ fontSize: 15, color: "#6B6B70", marginBottom: 20, lineHeight: 22 }}>
          Nar Aura'nın senin hakkında bildiği her şey burada. İstediğin zaman indirebilir veya silebilirsin.
        </Text>

        {/* Şeffaflık kartı */}
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Eye size={22} color="#C73030" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E" }}>Tam şeffaflık</Text>
            <Text style={{ fontSize: 12, color: "#6B6B70", marginTop: 2, lineHeight: 16 }}>
              Verilerin Supabase AB (Frankfurt) sunucularında şifreli, 3. taraflara satılmaz.
            </Text>
          </View>
        </View>

        {/* İstatistikler */}
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#8A8A8E", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
          Kayıtlı veriler
        </Text>
        <View style={{ backgroundColor: "#FFF", borderRadius: 14, padding: 4, marginBottom: 20 }}>
          <StatRow label="Profil" value={stats.hasProfile ? "Kayıtlı" : "Yok"} />
          <StatRow label="Tarama sayısı" value={String(stats.scans)} />
          <StatRow label="Günlük özet" value={String(stats.dailyLogs)} />
          <StatRow label="Başarım" value={String(stats.achievements)} last />
        </View>

        {/* Export */}
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#8A8A8E", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
          Verilerini indir
        </Text>

        <Pressable
          onPress={exportJSON}
          disabled={exporting}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#F5F5F5" : "#FFF",
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
            opacity: exporting ? 0.5 : 1,
          })}
        >
          <FileText size={20} color="#C73030" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E" }}>JSON olarak indir</Text>
            <Text style={{ fontSize: 12, color: "#6B6B70", marginTop: 2 }}>
              Tüm veriler — profil, taramalar, günlükler, lokal veriler
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={exportCSV}
          disabled={exporting}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#F5F5F5" : "#FFF",
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            opacity: exporting ? 0.5 : 1,
          })}
        >
          <Download size={20} color="#C73030" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1C1E" }}>CSV olarak indir</Text>
            <Text style={{ fontSize: 12, color: "#6B6B70", marginTop: 2 }}>
              Sadece taramalar (tablo, Excel uyumlu)
            </Text>
          </View>
        </Pressable>

        {/* Silme linki */}
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#FFE8E8" : "transparent",
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: "#C8362F",
          })}
        >
          <Trash2 size={18} color="#C8362F" />
          <Text style={{ flex: 1, fontSize: 14, color: "#C8362F", fontWeight: "600" }}>
            Hesabımı tamamen sil
          </Text>
        </Pressable>

        <Text style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 20, lineHeight: 16 }}>
          KVKK + GDPR uyumlu. Verilerin silme talebin 30 gün içinde tamamlanır.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F0F0F0",
      }}
    >
      <Text style={{ fontSize: 14, color: "#6B6B70" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E" }}>{value}</Text>
    </View>
  );
}
