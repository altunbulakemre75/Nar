import { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface Props {
  icon?: ReactNode;
  iconBg?: string;
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
  iconBg,
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
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ECECEE",
        backgroundColor: pressed ? "#FAFAFA" : "transparent",
      })}
    >
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: iconBg ?? (destructive ? "#FEECEC" : "#F3F4F6"),
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {icon}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: titleColor, fontWeight: "600" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        <View style={{ marginLeft: 8 }}>{rightElement}</View>
      ) : value ? (
        <Text style={{ fontSize: 14, color: "#888", marginRight: 4 }}>{value}</Text>
      ) : null}

      {onPress && !rightElement ? (
        <ChevronRight size={18} color="#C0C0C0" strokeWidth={2} style={{ marginLeft: 4 }} />
      ) : null}
    </Pressable>
  );
}
