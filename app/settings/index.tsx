import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Linking,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, MoreHorizontal, Sparkles, ChevronRight } from "lucide-react-native";
// ChevronRight used in profile card only
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import {
  cancelDailyReminder,
  requestPermission,
  scheduleDailyReminder,
  useNotifStore,
} from "@/lib/notifications";
import { useWaterStore } from "@/lib/waterStore";
import { useMoodStore } from "@/lib/moodStore";
import { useMealStore } from "@/lib/mealStore";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const name = (user?.user_metadata as any)?.name ?? null;
  const email = user?.email ?? "";
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();

  const notifEnabled = useNotifStore((s) => s.enabled);
  const setNotifEnabled = useNotifStore((s) => s.setEnabled);
  const notifHour = useNotifStore((s) => s.hour);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleNotifications = async (next: boolean) => {
    if (next) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert(
          "İzin gerekli",
          "Bildirimleri alabilmek için Ayarlar'dan Nar Aura'ya bildirim izni vermelisin."
        );
        return;
      }
      await scheduleDailyReminder(notifHour);
      setNotifEnabled(true);
    } else {
      await cancelDailyReminder();
      setNotifEnabled(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("user_achievements").delete().eq("user_id", user.id),
        supabase.from("scans").delete().eq("user_id", user.id),
        supabase.from("daily_logs").delete().eq("user_id", user.id),
      ]);
      await supabase.from("profiles").delete().eq("id", user.id);
    } catch {
      setDeleting(false);
      Alert.alert("Silme başarısız", "Tekrar dene.");
      return;
    }
    setDeleting(false);
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleDownloadData = () => {
    Alert.alert(
      "Verilerini indir",
      "JSON olarak şunlar dışa aktarılacak:\n\n• Profil (yaş, hedef, sağlık modları)\n• Tüm taramaların\n• Günlük özetler\n• Başarımların\n• Su, ruh hali, yemek günlüğü geçmişi\n\nDosyayı istediğin yere kaydedebilir veya paylaşabilirsin.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "İndir", onPress: () => doDownload() },
      ]
    );
  };

  const doDownload = async () => {
    if (!user) return;
    try {
      const [profile, scans, achievements, dailyLogs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("scans").select("*, product:products(name, brand, barcode)").eq("user_id", user.id),
        supabase.from("user_achievements").select("*").eq("user_id", user.id),
        supabase.from("daily_logs").select("*").eq("user_id", user.id),
      ]);

      // Cihazda tutulan yerel veriler (su, ruh hali, yemek günlüğü)
      const waterState = useWaterStore.getState();
      const moodState = useMoodStore.getState();
      const mealState = useMealStore.getState();

      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: "Nar Aura v0.1.0",
        user: { id: user.id, email: user.email, name },
        profile: profile.data,
        scans: scans.data,
        daily_logs: dailyLogs.data,
        achievements: achievements.data,
        water: { date: waterState.date, glasses: waterState.glasses },
        mood_history: moodState.history,
        meals: mealState.byDate,
      };

      await Share.share({
        title: "Nar Aura verilerim",
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert("Hata", "Veriler dışa aktarılamadı.");
    }
  };

  const mailTo = (subject: string) => {
    const url = `mailto:destek@narapp.com?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("E-posta açılamadı", "destek@narapp.com adresine manuel gönderebilirsin.")
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2EFEA" }}>
      {/* Silme overlay */}
      {deleting && (
        <View
          style={{
            position: "absolute",
            top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 100,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ backgroundColor: "#FFF", padding: 28, borderRadius: 16, alignItems: "center", gap: 12 }}>
            <ActivityIndicator size="large" color="#C8362F" />
            <Text style={{ fontSize: 15, color: "#1C1C1E", fontWeight: "600" }}>Hesap siliniyor…</Text>
          </View>
        </View>
      )}

      {/* Delete confirm modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", paddingHorizontal: 8, paddingBottom: 8 }}>
          <Pressable style={{ position: "absolute", inset: 0 } as any} onPress={() => setShowDeleteModal(false)} />
          <View style={{ gap: 8 }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16, overflow: "hidden" }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 16, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: "#E0E0E0" }}>
                <Text style={{ fontSize: 17, fontWeight: "600", color: "#1C1C1E", textAlign: "center", marginBottom: 4 }}>
                  Hesabını silmek istediğine emin misin?
                </Text>
                <Text style={{ fontSize: 13, color: "#8A8A8E", textAlign: "center", lineHeight: 18 }}>
                  Bu işlem geri alınamaz. Tüm verilerin kalıcı olarak silinecek.
                </Text>
              </View>
              <Pressable
                onPress={handleDeleteAccount}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: pressed ? "#F5F5F5" : "transparent",
                })}
              >
                <Text style={{ fontSize: 17, fontWeight: "600", color: "#C8362F" }}>Hesabı Sil</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setShowDeleteModal(false)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#F0F0F0" : "rgba(255,255,255,0.97)",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#007AFF" }}>İptal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, marginTop: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={20} color="#1C1C1E" strokeWidth={2} />
          </Pressable>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
            <MoreHorizontal size={20} color="#1C1C1E" strokeWidth={2} />
          </View>
        </View>

        {/* Başlık */}
        <Text style={{ fontSize: 34, fontWeight: "700", color: "#1C1C1E", letterSpacing: -0.8, lineHeight: 40, marginTop: 8, marginBottom: 24 }}>
          Ayarlar
        </Text>

        {/* Profil kartı */}
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#F5F5F5" : "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          })}
        >
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#C8362F", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#FFF" }}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#1C1C1E", lineHeight: 22 }} numberOfLines={1}>
              {name ?? "İsim ekle"}
            </Text>
            <Text style={{ fontSize: 14, color: "#8A8A8E", lineHeight: 18, marginTop: 2 }} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <ChevronRight size={18} color="#D1D1D6" strokeWidth={2} />
        </Pressable>

        {/* Premium banner */}
        <Pressable
          onPress={() => router.push("/premium")}
          style={{ backgroundColor: "#C8362F", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={22} color="#FFF" strokeWidth={2} fill="#FFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#FFF", lineHeight: 22 }}>Nar Aura Premium</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 18, marginTop: 2 }}>
              Sınırsız AI + fotoğraf analizi
            </Text>
          </View>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" }}>
            <Text style={{ fontSize: 11, color: "#FFF", fontWeight: "700", letterSpacing: 1 }}>YAKINDA</Text>
          </View>
        </Pressable>

        <View style={{ gap: 10, marginTop: 8 }}>
          <RowChevron label="Aura kişiliği" onPress={() => router.push("/settings/narci-personality")} />
          <RowChevron label="Sağlık modları" onPress={() => router.push("/settings/health-modes")} />
          <RowToggle label="Bildirimler" value={notifEnabled} onChange={handleToggleNotifications} />
          <RowValue label="Dil" value="Türkçe" onPress={() => Alert.alert("Dil", "İngilizce çeviri yakında eklenecek.")} />
          <RowChevron label="Verilerimi indir" onPress={handleDownloadData} />
          <RowDestructive label="Hesabı sil" onPress={() => setShowDeleteModal(true)} />
          <RowChevron label="Yardım merkezi" onPress={() => mailTo("Nar Aura - yardım")} />
          <RowChevron label="Hata bildir" onPress={() => mailTo("Nar Aura - hata bildirimi")} />
          <RowChevron label="Bize puan ver" onPress={() => Alert.alert("Yakında", "App Store'da yayınlanınca aktif olacak.")} />
          <RowChevron label="Gizlilik politikası" onPress={() => router.push("/legal/privacy")} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ————— Section —————



// ————— Row components —————

function RowChevron({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#1C1C1E",
        borderRadius: 12,
        backgroundColor: pressed ? "#1C1C1E" : "transparent",
      })}
    >
      {({ pressed }) => (
        <Text style={{ fontSize: 19, fontWeight: "500", color: pressed ? "#FFFFFF" : "#1C1C1E" }}>{label}</Text>
      )}
    </Pressable>
  );
}

function RowValue({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: pressed ? "#1C1C1E" : "transparent",
      })}
    >
      {({ pressed }) => (
        <>
          <Text style={{ fontSize: 19, fontWeight: "500", color: pressed ? "#FFFFFF" : "#1C1C1E" }}>{label}</Text>
          <Text style={{ fontSize: 17, color: pressed ? "rgba(255,255,255,0.7)" : "#8A8A8E" }}>{value}</Text>
        </>
      )}
    </Pressable>
  );
}

function RowToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: "#1C1C1E",
      borderRadius: 12,
    }}>
      <Text style={{ fontSize: 19, fontWeight: "500", color: "#1C1C1E", flex: 1, marginRight: 8 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E5E5EA", true: "#34C759" }}
        thumbColor="#FFF"
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );
}

function RowDestructive({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#1C1C1E",
        borderRadius: 12,
        backgroundColor: pressed ? "#1C1C1E" : "transparent",
      })}
    >
      {({ pressed }) => (
        <Text style={{ fontSize: 19, fontWeight: "500", color: pressed ? "#FFFFFF" : "#C8362F" }}>{label}</Text>
      )}
    </Pressable>
  );
}
