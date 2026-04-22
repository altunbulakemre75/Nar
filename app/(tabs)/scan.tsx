import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Linking, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { ScanLine, Zap, ZapOff, UtensilsCrossed } from "lucide-react-native";
import { getProductByBarcode } from "@/lib/products";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [torch, setTorch] = useState(false);
  const lastBarcodeRef = useRef<string | null>(null);
  // Ref-first guard: state henüz flush edilmeden arka arkaya gelen kare'leri engelle
  const lockedRef = useRef(false);

  // Sekmeye her dönüldüğünde tekrar taramaya izin ver
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setSearching(false);
      lastBarcodeRef.current = null;
      lockedRef.current = false;
    }, [])
  );

  if (!permission) {
    // İzin yükleniyor
    return (
      <SafeAreaView style={styles.permSafe}>
        <View style={styles.permBody} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const denied = permission.status === "denied" && !permission.canAskAgain;

    return (
      <SafeAreaView style={styles.permSafe}>
        <View style={styles.permBody}>
          <View style={styles.permIcon}>
            <ScanLine size={44} color="#C73030" strokeWidth={1.6} />
          </View>

          <Text style={styles.permTitle}>Kamera izni gerekli</Text>
          <Text style={styles.permSub}>
            {denied
              ? "Kamera izni reddedildi. Ayarlardan Nar Aura'ya kamera izni verebilirsin."
              : "Nar Aura, barkod taramak için kameraya ihtiyaç duyar."}
          </Text>

          <Pressable
            onPress={async () => {
              if (denied) {
                Linking.openSettings();
              } else {
                await requestPermission();
              }
            }}
            style={styles.permBtn}
          >
            <Text style={styles.permBtnText}>
              {denied ? "Ayarlara git" : "İzin ver"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleScan = async ({ data }: { data: string; type: string }) => {
    // Ref-first: sync kilitleme, state flush'ı beklemeden
    if (lockedRef.current) return;
    if (lastBarcodeRef.current === data) return;
    lockedRef.current = true;

    setScanned(true);
    setSearching(true);
    lastBarcodeRef.current = data;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Ürünü önceden getir - cache hit ise anında, OFF'a gitmesi gerekirse 3-5 sn
    const product = await getProductByBarcode(data);
    setSearching(false);

    if (product) {
      router.push({ pathname: "/scan-result", params: { barcode: data } });
    } else {
      router.push({ pathname: "/scan-not-found", params: { barcode: data } });
    }
  };

  return (
    <View style={styles.cameraWrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"],
        }}
      />

      {/* Karartma + çerçeve */}
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setTorch((t) => !t)}
            style={styles.roundBtn}
            hitSlop={10}
          >
            {torch ? (
              <Zap size={22} color="#FFD700" strokeWidth={2} />
            ) : (
              <ZapOff size={22} color="#FFF" strokeWidth={2} />
            )}
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={styles.logo}>Nar</Text>
            <Text style={styles.logoAura}>Aura</Text>
          </View>

          {/* Yemek fotoğrafı kısayolu */}
          <Pressable
            onPress={() => router.push("/add-meal")}
            style={styles.roundBtn}
            hitSlop={10}
          >
            <UtensilsCrossed size={20} color="#FFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Orta çerçeve */}
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.frameHint}>Barkodu çerçeveye yerleştir</Text>
        </View>

        {/* Alt ipucu + yemek fotoğrafı CTA */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomHint}>
            Barkodu okut · Ya da ↑ üst sağdan yemek fotoğrafı çek
          </Text>
        </View>
      </SafeAreaView>

      {/* Arama loading overlay */}
      {searching && (
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color="#C73030" />
            <Text style={styles.searchingText}>Ürün aranıyor...</Text>
            <Text style={styles.searchingHint}>
              Veritabanlarını tarıyoruz, bu birkaç saniye sürebilir.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  permSafe: { flex: 1, backgroundColor: "#FFFDFB" },
  permBody: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  permIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  permTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8 },
  permSub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  permBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    backgroundColor: "#C73030",
    borderRadius: 999,
  },
  permBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  cameraWrap: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontFamily: "PlayfairDisplay-BoldItalic",
    fontSize: 40,
    lineHeight: 48,
    color: "#C73030",
  },
  logoAura: {
    fontFamily: "PlayfairDisplay-BoldItalic",
    fontSize: 22,
    color: "#C73030",
    opacity: 0.75,
    letterSpacing: 1,
  },

  frameWrap: { alignItems: "center", marginTop: -40 },
  frame: {
    width: 260,
    height: 160,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#FFF",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  frameHint: {
    marginTop: 24,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: "center",
  },
  bottomHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
  },

  // Searching overlay
  searchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  searchingBox: {
    backgroundColor: "#FFFDFB",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 260,
  },
  searchingText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  searchingHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 17,
  },
});
