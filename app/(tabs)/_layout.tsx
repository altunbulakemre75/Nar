import { Tabs } from "expo-router";
import { Home, ScanLine, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#BBBBBB",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFDFB",
          borderTopColor: "#EEEEEE",
          borderTopWidth: 0.5,
          paddingTop: 10,
          paddingBottom: 10,
          height: 68,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color }) => <ScanLine color={color} size={24} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={24} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
