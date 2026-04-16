import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MessageCircle, ChefHat, ShoppingCart, CalendarDays, ScanLine } from "lucide-react-native";
import { router } from "expo-router";

const SCORE = 72;

const TILES = [
  {
    id: "ask",
    label: "Narcı'ya Sor",
    sub: "Yapay zeka asistanın",
    icon: MessageCircle,
    bg: "#FFF5F5",
    iconColor: "#C73030",
    route: "/(tabs)/community",
  },
  {
    id: "recipe",
    label: "Tarif Öner",
    sub: "Sağlıklı alternatifler",
    icon: ChefHat,
    bg: "#F5FFF7",
    iconColor: "#2D8A4E",
    route: "/(tabs)/community",
  },
  {
    id: "shop",
    label: "Alışveriş",
    sub: "Listem & öneriler",
    icon: ShoppingCart,
    bg: "#FFFBF0",
    iconColor: "#B87A00",
    route: "/(tabs)/community",
  },
  {
    id: "weekly",
    label: "Haftalık",
    sub: "Beslenme özeti",
    icon: CalendarDays,
    bg: "#F0F5FF",
    iconColor: "#2D5FA8",
    route: "/(tabs)/community",
  },
] as const;

function ScoreGradientBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <View style={styles.scoreBarWrapper}>
      <View style={styles.scoreBarTrack}>
        <LinearGradient
          colors={["#E53E3E", "#ECC94B", "#38A169"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.scoreBarFill, { width: `${pct}%` }]}
        />
        {/* thumb */}
        <View style={[styles.scoreThumb, { left: `${pct}%` }]} />
      </View>
      <View style={styles.scoreBarLabels}>
        <Text style={styles.scoreBarLabel}>0</Text>
        <Text style={styles.scoreBarLabel}>50</Text>
        <Text style={styles.scoreBarLabel}>100</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <Text style={styles.logo}>Nar</Text>

        {/* ── Skor Kartı ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Günlük Sağlık Skoru</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{SCORE}</Text>
            <Text style={styles.scoreMax}> / 100</Text>
          </View>
          <ScoreGradientBar score={SCORE} />
          <Text style={styles.scoreHint}>Bugün 3 ürün taradın · İyi gidiyorsun!</Text>
        </View>

        {/* ── 4 Tile Grid ── */}
        <View style={styles.grid}>
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Pressable
                key={tile.id}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: tile.bg, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push(tile.route)}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: tile.iconColor + "22" }]}>
                  <Icon color={tile.iconColor} size={22} />
                </View>
                <Text style={styles.tileLabel}>{tile.label}</Text>
                <Text style={styles.tileSub}>{tile.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Büyük Tara Butonu ── */}
        <Pressable
          style={({ pressed }) => [styles.scanBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <ScanLine color="#FFFDFB" size={24} />
          <Text style={styles.scanBtnText}>Barkod veya yemek tara</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFDFB",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Logo
  logo: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    fontSize: 42,
    color: "#C73030",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    letterSpacing: 1,
  },

  // Skor kartı
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    color: "#8A7F75",
    marginBottom: 4,
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 52,
  },
  scoreMax: {
    fontSize: 20,
    color: "#8A7F75",
    marginBottom: 4,
  },
  scoreBarWrapper: {
    marginBottom: 10,
  },
  scoreBarTrack: {
    height: 10,
    backgroundColor: "#EDE8E1",
    borderRadius: 5,
    overflow: "visible",
    position: "relative",
  },
  scoreBarFill: {
    height: 10,
    borderRadius: 5,
  },
  scoreThumb: {
    position: "absolute",
    top: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    marginLeft: -8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  scoreBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  scoreBarLabel: {
    fontSize: 11,
    color: "#B0A898",
  },
  scoreHint: {
    fontSize: 12,
    color: "#8A7F75",
    marginTop: 2,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  tile: {
    width: "47.5%",
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: "space-between",
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  tileSub: {
    fontSize: 11,
    color: "#8A7F75",
  },

  // Scan button
  scanBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scanBtnText: {
    color: "#FFFDFB",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
