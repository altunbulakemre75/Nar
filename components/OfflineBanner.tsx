import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useNetworkStatus } from "@/lib/network";

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // İnternet olmayan veya ulaşılamayan durumda göster
  const offline = !isConnected || isInternetReachable === false;
  if (!offline) return null;

  return (
    <View
      style={{
        backgroundColor: "#C73030",
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <WifiOff size={14} color="#FFF" strokeWidth={2} />
      <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
        İnternet bağlantın yok
      </Text>
    </View>
  );
}
