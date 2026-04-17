import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch, Linking, Share, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChevronLeft,
  Bell,
  Moon,
  Globe,
  Download,
  Trash2,
  Shield,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Star,
  LogOut,
  Sparkles,
  Pencil,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import ListItem from "@/components/ui/ListItem";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const name = (user?.user_metadata as any)?.name ?? null;
  const email = user?.email ?? "";
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();

  const [notifications, setNotifications] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı sil",
      "Bu işlem geri alınamaz. Tüm verilerin (profil, taramalar, rozetler) silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Devam",
          style: "destructive",
          onPress: () =>
            Alert.alert("Emin misin?", "Son onay. Hesabı silmek için 'Evet, sil'e bas.", [
              { text: "İptal", style: "cancel" },
              {
                text: "Evet, sil",
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
                  } catch (e) {
                    setDeleting(false);
                    Alert.alert(
                      "Silme başarısız",
                      "Verilerin tamamı silinemedi. İnternet bağlantını kontrol et ve tekrar dene."
                    );
                    return;
                  }
                  setDeleting(false);
                  Alert.alert(
                    "Hesap silindi",
                    "Verilerin temizlendi. Auth kaydı için destek ile iletişime geç."
                  );
                  await signOut();
                  router.replace("/(auth)/login");
                },
              },
            ]),
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

      await Share.share({
        title: "Nar verilerim",
        message: JSON.stringify(payload, null, 2),
      });
    } catch (e) {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF8F5" }}>
      {deleting && (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 100, alignItems: "center", justifyContent: "center" }}>
          <View style={{ backgroundColor: "#FFF", padding: 24, borderRadius: 16, alignItems: "center", gap: 12 }}>
            <ActivityIndicator size="large" color="#C73030" />
            <Text style={{ fontSize: 14, color: "#333", fontWeight: "600" }}>Hesap siliniyor...</Text>
          </View>
        </View>
      )}
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={26} color="#111" strokeWidth={2.2} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hesap kartı */}
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={{
            marginHorizontal: 16,
            marginTop: 6,
            padding: 14,
            borderRadius: 16,
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#ECECEE",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#E8E0D5", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#8B7A5E" }}>{initial}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#111" }} numberOfLines={1}>
              {name ?? "Adını ekle"}
            </Text>
            <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <Pencil size={20} color="#C73030" strokeWidth={2} />
        </Pressable>

        {/* Nar Premium — gradient kart */}
        <Pressable
          onPress={() => Alert.alert("Nar Premium", "Yakında: Sınırsız Narcı AI sohbet, fotoğraf analizi, detaylı rapor.")}
          style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#F7D7D2", "#E8A8A0", "#D87870"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 14, flexDirection: "row", alignItems: "center" }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(199,48,48,0.85)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Sparkles size={20} color="#FFF" strokeWidth={2} fill="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B1A1A" }}>Nar Premium</Text>
              <Text style={{ fontSize: 12, color: "#6B1A1A", marginTop: 2, opacity: 0.8 }}>
                Sınırsız AI + fotoğraf analizi
              </Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FFF" }}>
              <Text style={{ fontSize: 11, color: "#C73030", fontWeight: "800", letterSpacing: 0.5 }}>YAKINDA</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Tercihler */}
        <Section title="Tercihler">
          <ListItem
            icon={<Bell size={16} color="#666" strokeWidth={1.8} />}
            title="Bildirimler"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#E5E5E5", true: "#C73030" }}
                thumbColor="#FFF"
                ios_backgroundColor="#E5E5E5"
              />
            }
          />
          <ListItem
            icon={<Globe size={16} color="#666" strokeWidth={1.8} />}
            title="Dil"
            subtitle="Türkçe"
            onPress={() => Alert.alert("Yakında", "Yakında daha fazla dil eklenecek.")}
          />
          <ListItem
            icon={<Moon size={16} color="#666" strokeWidth={1.8} />}
            title="Tema"
            subtitle="Açık"
            onPress={() => Alert.alert("Yakında", "Koyu tema yakında eklenecek.")}
            last
          />
        </Section>

        {/* Veriler */}
        <Section title="Veriler">
          <ListItem
            icon={<Download size={16} color="#666" strokeWidth={1.8} />}
            title="Verilerimi indir"
            onPress={handleDownloadData}
          />
          <ListItem
            icon={<Trash2 size={16} color="#C73030" strokeWidth={1.8} />}
            title="Hesabı sil"
            onPress={handleDeleteAccount}
            destructive
            last
          />
        </Section>

        {/* Destek */}
        <Section title="Destek">
          <ListItem
            icon={<Mail size={16} color="#666" strokeWidth={1.8} />}
            title="Destek"
            onPress={() => mailTo("Nar - destek")}
          />
          <ListItem
            icon={<MessageSquare size={16} color="#666" strokeWidth={1.8} />}
            title="Hata bildir"
            onPress={() => mailTo("Nar - hata bildirimi")}
          />
          <ListItem
            icon={<Star size={16} color="#666" strokeWidth={1.8} />}
            title="Bize puan ver"
            onPress={() => Alert.alert("Yakında", "App Store'da yayınlanınca aktif olacak.")}
            last
          />
        </Section>

        {/* Yasal — başlıksız grup */}
        <View style={{ marginTop: 12, marginHorizontal: 16, backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#ECECEE", overflow: "hidden" }}>
          <ListItem
            icon={<Shield size={16} color="#666" strokeWidth={1.8} />}
            title="Gizlilik politikası"
            onPress={() => router.push("/legal/privacy")}
          />
          <ListItem
            icon={<FileText size={16} color="#666" strokeWidth={1.8} />}
            title="Kullanım koşulları"
            onPress={() => router.push("/legal/terms")}
          />
          <ListItem
            icon={<Info size={16} color="#666" strokeWidth={1.8} />}
            title="Hakkında"
            onPress={() => router.push("/legal/about")}
            last
          />
        </View>

        {/* Çıkış yap — tam genişlikli kart */}
        <Pressable
          onPress={handleSignOut}
          style={{
            marginTop: 20,
            marginHorizontal: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#ECECEE",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>Çıkış yap</Text>
          <LogOut size={20} color="#C73030" strokeWidth={2} />
        </Pressable>

        <Text style={{ textAlign: "center", fontSize: 11, color: "#BBB", marginTop: 16 }}>
          Nar v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
          marginHorizontal: 20,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: "#FFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#ECECEE",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}
