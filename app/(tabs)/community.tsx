import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";

export default function Community() {
  return (
    <SafeAreaView className="flex-1 bg-nar-cream" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-8">
        <Users size={64} color="#C73030" strokeWidth={1.5} />
        <Text className="mt-6 text-xl font-medium text-gray-900">Topluluk</Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          Kullanıcı yorumları, ürün oylamaları ve tarifler burada olacak.
        </Text>
      </View>
    </SafeAreaView>
  );
}
