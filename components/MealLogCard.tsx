import { useMemo } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { UtensilsCrossed, Plus, Trash2 } from "lucide-react-native";
import { useMealStore } from "@/lib/mealStore";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MealLogCard() {
  const byDate = useMealStore((s) => s.byDate);
  const remove = useMealStore((s) => s.remove);

  const meals = useMemo(() => byDate[todayKey()] ?? [], [byDate]);
  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          fat: acc.fat + m.fat,
          carbs: acc.carbs + m.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      ),
    [meals]
  );

  const handleRemove = (id: string, name: string) => {
    Alert.alert("Sil", `"${name}" günlükten silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          remove(id);
        },
      },
    ]);
  };

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#FFF5F2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UtensilsCrossed size={18} color="#C73030" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>Yemek günlüğü</Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {meals.length === 0
              ? "Bugün henüz yemek eklenmedi"
              : `${meals.length} öğün · ${totals.calories} kcal`}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/add-meal")}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#C73030",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={18} color="#FFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {meals.length > 0 && (
        <View style={{ gap: 8 }}>
          {meals.map((m) => (
            <View
              key={m.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: "#F7F7F8",
                borderRadius: 10,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#111" }} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                  {m.calories} kcal · P{m.protein} · Y{m.fat} · K{m.carbs}
                </Text>
              </View>
              <Pressable onPress={() => handleRemove(m.id, m.name)} hitSlop={6} style={{ padding: 4 }}>
                <Trash2 size={16} color="#999" strokeWidth={2} />
              </Pressable>
            </View>
          ))}

          {/* Günlük toplam */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingTop: 10,
              marginTop: 4,
              borderTopWidth: 1,
              borderTopColor: "#F0F0F0",
            }}
          >
            <TotalCell value={`${totals.calories}`} label="kcal" />
            <TotalCell value={`${totals.protein}g`} label="protein" />
            <TotalCell value={`${totals.fat}g`} label="yağ" />
            <TotalCell value={`${totals.carbs}g`} label="karb" />
          </View>
        </View>
      )}
    </View>
  );
}

function TotalCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#C73030" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{label}</Text>
    </View>
  );
}
