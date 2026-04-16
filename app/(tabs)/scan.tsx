import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.text}>Tara</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFDFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, color: "#1A1A1A", fontWeight: "600" },
});
