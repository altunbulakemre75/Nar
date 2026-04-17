import { Tabs } from "expo-router";
import { Home, ScanLine, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#C73030",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          backgroundColor: "#FFFDFB",
          borderTopColor: "#EEEEEE",
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Tara",
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size - 2} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
