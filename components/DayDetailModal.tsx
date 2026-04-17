import { useEffect, useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { getScansByDate, type ScanOnDate } from "@/lib/stats";
import { scoreColor } from "@/constants/colors";

interface Props {
  date: string | null;          // YYYY-MM-DD; null ise modal kapalı
  onClose: () => void;
}

export default function DayDetailModal({ date, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<ScanOnDate[]>([]);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getScansByDate(date).then((list) => {
      setScans(list);
      setLoading(false);
    });
  }, [date]);

  const visible = date !== null;

  const average =
    scans.length > 0
      ? Math.round(scans.reduce((s, x) => s + x.score, 0) / scans.length)
      : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#FFFDFB",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85%",
            paddingBottom: 20,
          }}
        >
          {/* Header */}
          <View
            className="px-4 py-3 flex-row items-center justify-between border-b"
            style={{ borderColor: "#EEE" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
              {date ? format(parseISO(date), "dd MMMM yyyy") : ""}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color="#111" strokeWidth={2} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator color="#C73030" />
            </View>
          ) : scans.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "#666" }}>Bu gün tarama yok</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Ortalama skor kartı */}
              <View
                className="rounded-2xl p-4 mb-3 flex-row items-center"
                style={{
                  backgroundColor: scoreColor(average) + "22",
                  borderWidth: 1,
                  borderColor: scoreColor(average),
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "#666", fontWeight: "500" }}>
                    Ortalama skor
                  </Text>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: "700",
                      color: scoreColor(average),
                      lineHeight: 44,
                    }}
                  >
                    {average}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {scans.length} tarama
                </Text>
              </View>

              {/* Tarama listesi */}
              {scans.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    onClose();
                    router.push({ pathname: "/scan-result", params: { barcode: s.product.barcode } });
                  }}
                  className="flex-row items-center rounded-2xl border p-3 mb-2"
                  style={{ backgroundColor: "#FFF", borderColor: "#EEE" }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "#FFF5F2" }}
                  >
                    <Text style={{ fontSize: 18 }}>📦</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
                      numberOfLines={1}
                    >
                      {s.product.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
                      {format(parseISO(s.scanned_at), "HH:mm")}
                      {s.product.brand ? ` · ${s.product.brand}` : ""}
                    </Text>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: scoreColor(s.score) + "22" }}
                  >
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: scoreColor(s.score) }}
                    >
                      {s.score}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
