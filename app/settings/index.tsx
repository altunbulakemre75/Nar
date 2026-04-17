import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch, Linking, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  User,
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
} from "lucide-react-native";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import ListItem from "@/components/ui/ListItem";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const name = (user?.user_metadata as any)?.name ?? null;

  const [notifications, setNotifications] = useState(false);

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
                  await supabase.from("profiles").delete().eq("id", user.id);
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
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={26} color="#111" strokeWidth={2.2} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hesap kartı */}
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#EEE",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF5F2", alignItems: "center", justifyContent: "center" }}>
            <User size={26} color="#C73030" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#111" }}>
              {name ?? "Adını ekle"}
            </Text>
            <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }} numberOfLines={1}>
              {user?.email ?? ""}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#C73030", fontWeight: "600" }}>Düzenle</Text>
        </Pressable>

        {/* Premium — küçük pill */}
        <Pressable
          onPress={() => Alert.alert("Nar Premium", "Yakında: Sınırsız Narcı AI sohbet, fotoğraf analizi, detaylı rapor.")}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFF5F2",
            borderWidth: 1,
            borderColor: "#F5D4CA",
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#C73030", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Sparkles size={18} color="#FFF" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B1A1A" }}>Nar Premium</Text>
            <Text style={{ fontSize: 12, color: "#8B4848", marginTop: 2 }}>Sınırsız AI + fotoğraf analizi</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#FFF" }}>
            <Text style={{ fontSize: 11, color: "#C73030", fontWeight: "700" }}>YAKINDA</Text>
          </View>
        </Pressable>

        {/* Tercihler */}
        <Section title="Tercihler">
          <ListItem
            icon={<Bell size={16} color="#666" strokeWidth={1.8} />}
            title="Bildirimler"
            subtitle="Günlük tarama hatırlatması"
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
            value="Türkçe"
            onPress={() => Alert.alert("Yakında", "Yakında daha fazla dil eklenecek.")}
          />
          <ListItem
            icon={<Moon size={16} color="#666" strokeWidth={1.8} />}
            title="Tema"
            value="Açık"
            onPress={() => Alert.alert("Yakında", "Koyu tema yakında eklenecek.")}
            last
          />
        </Section>

        {/* Veriler */}
        <Section title="Veriler">
          <ListItem
            icon={<Download size={16} color="#666" strokeWidth={1.8} />}
            title="Verilerimi indir"
            value="JSON"
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
            value="destek@narapp.com"
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

        {/* Yasal */}
        <Section title="Yasal">
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
        </Section>

        {/* Çıkış */}
        <View style={{ marginTop: 18, marginHorizontal: 16 }}>
          <Pressable
            onPress={handleSignOut}
            style={{
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: "#FFF",
              borderWidth: 1,
              borderColor: "#FFD6D6",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogOut size={18} color="#C73030" strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#C73030" }}>Çıkış yap</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: "center", fontSize: 11, color: "#BBB", marginTop: 20 }}>
          Nar v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
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
          borderColor: "#EEE",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}
