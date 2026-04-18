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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, MoreHorizontal, Sparkles, ChevronRight } from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import {
  cancelDailyReminder,
  requestPermission,
  scheduleDailyReminder,
  useNotifStore,
} from "@/lib/notifications";
import ListItem from "@/components/ui/ListItem";

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

  const handleToggleNotifications = async (next: boolean) => {
    if (next) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert(
          "İzin gerekli",
          "Bildirimleri alabilmek için Ayarlar'dan Nar'a bildirim izni vermelisin."
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabını silmek istediğine emin misin?",
      "Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
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
          },
        },
      ]
    );
  };

  const handleDownloadData = async () => {
    if (!user) return;
    try {
      const [profile, scans, achievements] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("scans").select("*, product:products(name, brand, barcode)").eq("user_id", user.id),
        supabase.from("user_achievements").select("*").eq("user_id", user.id),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email, name },
        profile: profile.data,
        scans: scans.data,
        achievements: achievements.data,
      };
      await Share.share({ title: "Nar verilerim", message: JSON.stringify(payload, null, 2) });
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            marginTop: 8,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} color="#1C1C1E" strokeWidth={2} />
          </Pressable>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={20} color="#1C1C1E" strokeWidth={2} />
          </View>
        </View>

        {/* Büyük başlık */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "700",
            color: "#1C1C1E",
            letterSpacing: -0.8,
            lineHeight: 40,
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          Ayarlar
        </Text>

        {/* Profil kartı — yatay satır */}
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#F5F5F5" : "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#C8362F",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#FFF" }}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 17, fontWeight: "600", color: "#1C1C1E", lineHeight: 20 }}
              numberOfLines={1}
            >
              {name ?? "İsim ekle"}
            </Text>
            <Text
              style={{ fontSize: 14, color: "#8A8A8E", lineHeight: 18, marginTop: 2 }}
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
          <ChevronRight size={18} color="#9A9A9A" strokeWidth={2} />
        </Pressable>

        {/* Premium banner */}
        <Pressable
          onPress={() => router.push("/premium")}
          style={{
            backgroundColor: "#C8362F",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={22} color="#FFF" strokeWidth={2} fill="#FFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#FFF", lineHeight: 20 }}>
              Nar Premium
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 17, marginTop: 2 }}>
              Sınırsız AI + fotoğraf analizi
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.7)",
            }}
          >
            <Text style={{ fontSize: 11, color: "#FFF", fontWeight: "600", letterSpacing: 1 }}>
              YAKINDA
            </Text>
          </View>
        </Pressable>

        {/* TERCİHLER */}
        <Section label="Tercihler">
          <ListItem
            title="Bildirimler"
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                thumbColor="#FFF"
                ios_backgroundColor="#E5E5EA"
              />
            }
          />
          <ListItem
            title="Dil"
            value="Türkçe"
            onPress={() => Alert.alert("Dil", "İngilizce çeviri yakında eklenecek.")}
            last
          />
        </Section>

        {/* HESAP */}
        <Section label="Hesap">
          <ListItem title="Verilerimi indir" onPress={handleDownloadData} />
          <ListItem
            title="Hesabı sil"
            onPress={handleDeleteAccount}
            destructive
            last
          />
        </Section>

        {/* DESTEK */}
        <Section label="Destek">
          <ListItem title="Yardım merkezi" onPress={() => mailTo("Nar - yardım")} />
          <ListItem title="Hata bildir" onPress={() => mailTo("Nar - hata bildirimi")} />
          <ListItem
            title="Bize puan ver"
            onPress={() => Alert.alert("Yakında", "App Store'da yayınlanınca aktif olacak.")}
            last
          />
        </Section>

        {/* HAKKINDA */}
        <Section label="Hakkında">
          <ListItem title="Gizlilik politikası" onPress={() => router.push("/legal/privacy")} last />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: "#8A8A8E",
          letterSpacing: 0.8,
          marginBottom: 8,
          paddingHorizontal: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        {children}
      </View>
    </View>
  );
}
