import { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  rightElement?: ReactNode;
}

export default function ListItem({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
  last = false,
  rightElement,
}: Props) {
  const titleColor = destructive ? "#C73030" : "#111";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F0F0F0",
        backgroundColor: pressed ? "#FAFAFA" : "transparent",
      })}
    >
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: destructive ? "#FFF5F2" : "#F5F5F5",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {icon}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: titleColor, fontWeight: "500" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>

      {rightElement ? (
        rightElement
      ) : value ? (
        <Text style={{ fontSize: 13, color: "#999", marginRight: 6 }}>{value}</Text>
      ) : null}

      {onPress && !rightElement ? <ChevronRight size={16} color="#CCC" /> : null}
    </Pressable>
  );
}
