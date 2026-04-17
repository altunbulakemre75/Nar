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
            Alert.alert(
              "Emin misin?",
              "Son onay. Hesabı silmek için EVET yaz.",
              [
                { text: "İptal", style: "cancel" },
                {
                  text: "Evet, sil",
                  style: "destructive",
                  onPress: async () => {
                    if (!user) return;
                    // profil + ilişkili kayıtlar zaten CASCADE ile silinecek
                    await supabase.from("profiles").delete().eq("id", user.id);
                    // auth.users.delete için backend/edge function gerekir
                    Alert.alert(
                      "Hesap silindi",
                      "Verilerin temizlendi. Auth kaydı için destek ile iletişime geç."
                    );
                    await signOut();
                    router.replace("/(auth)/login");
                  },
                },
              ]
            ),
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFDFB" }}>
      {/* Top bar */}
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <Pressable onPress={() => router.back()} hitSlop={10} className="w-9 h-9 items-center justify-center">
          <ChevronLeft size={26} color="#111" strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", marginLeft: 4 }}>
          Ayarlar
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profil */}
        <Section title="Profil">
          <ListItem
            icon={<User size={16} color="#666" />}
            title="Profili düzenle"
            subtitle={name ?? user?.email ?? ""}
            onPress={() => router.push("/onboarding")}
            last
          />
        </Section>

        {/* Tercihler */}
        <Section title="Tercihler">
          <ListItem
            icon={<Bell size={16} color="#666" />}
            title="Bildirimler"
            subtitle="Günlük tarama hatırlatması"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#DDD", true: "#C73030" }}
                thumbColor="#FFF"
              />
            }
          />
          <ListItem
            icon={<Globe size={16} color="#666" />}
            title="Dil"
            value="Türkçe"
            onPress={() => Alert.alert("Yakında", "Yakında daha fazla dil eklenecek.")}
          />
          <ListItem
            icon={<Moon size={16} color="#666" />}
            title="Tema"
            value="Açık"
            onPress={() => Alert.alert("Yakında", "Koyu tema yakında eklenecek.")}
            last
          />
        </Section>

        {/* Abonelik (V2 placeholder) */}
        <Section title="Abonelik">
          <View
            style={{
              marginHorizontal: 16,
              marginVertical: 4,
              padding: 16,
              backgroundColor: "#FFF5F2",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#F5D4CA",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B1A1A", marginBottom: 8 }}>
              Nar Premium
            </Text>
            <Text style={{ fontSize: 12, color: "#8B4848", lineHeight: 18, marginBottom: 12 }}>
              · Sınırsız Narcı AI sohbet{"\n"}· Yemek fotoğrafı analizi{"\n"}· Detaylı rapor + export
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#C73030" }}>99₺</Text>
              <Text style={{ fontSize: 11, color: "#8B4848" }}>/ay</Text>
              <Text style={{ fontSize: 12, color: "#8B4848" }}>·</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#C73030" }}>499₺</Text>
              <Text style={{ fontSize: 11, color: "#8B4848" }}>/yıl</Text>
            </View>
            <View
              style={{
                marginTop: 12,
                paddingVertical: 10,
                backgroundColor: "#FFF",
                borderRadius: 999,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#F5D4CA",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#999" }}>
                Yakında
              </Text>
            </View>
          </View>
        </Section>

        {/* Veriler */}
        <Section title="Veriler">
          <ListItem
            icon={<Download size={16} color="#666" />}
            title="Verilerimi indir"
            subtitle="JSON formatında"
            onPress={handleDownloadData}
          />
          <ListItem
            icon={<Trash2 size={16} color="#C73030" />}
            title="Hesabı sil"
            subtitle="Tüm verilerin silinir"
            onPress={handleDeleteAccount}
            destructive
            last
          />
        </Section>

        {/* Yasal */}
        <Section title="Yasal">
          <ListItem
            icon={<Shield size={16} color="#666" />}
            title="Gizlilik politikası"
            onPress={() => router.push("/legal/privacy")}
          />
          <ListItem
            icon={<FileText size={16} color="#666" />}
            title="Kullanım koşulları"
            onPress={() => router.push("/legal/terms")}
          />
          <ListItem
            icon={<Info size={16} color="#666" />}
            title="Hakkında"
            onPress={() => router.push("/legal/about")}
            last
          />
        </Section>

        {/* İletişim */}
        <Section title="İletişim">
          <ListItem
            icon={<Mail size={16} color="#666" />}
            title="Destek"
            subtitle="destek@narapp.com"
            onPress={() => mailTo("Nar - destek")}
          />
          <ListItem
            icon={<MessageSquare size={16} color="#666" />}
            title="Hata bildir"
            onPress={() => mailTo("Nar - hata bildirimi")}
          />
          <ListItem
            icon={<Star size={16} color="#666" />}
            title="Bize puan ver"
            onPress={() => Alert.alert("Yakında", "App Store'da yayınlanınca aktif olacak.")}
            last
          />
        </Section>

        {/* Hesap */}
        <Section title="Hesap">
          <ListItem
            icon={<LogOut size={16} color="#C73030" />}
            title="Çıkış yap"
            onPress={handleSignOut}
            destructive
            last
          />
        </Section>

        <Text style={{ textAlign: "center", fontSize: 11, color: "#BBB", marginTop: 24 }}>
          Nar v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
          marginHorizontal: 16,
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
          borderColor: "#F0F0F0",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}
