import { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface Props {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  rightElement?: ReactNode;
}

export default function ListItem({
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
  last = false,
  rightElement,
}: Props) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={!onPress && !rightElement}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          paddingHorizontal: 16,
          backgroundColor: pressed ? "#F5F5F5" : "#FFFFFF",
        })}
      >
        {/* Sol: başlık + opsiyonel alt yazı */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 17,
              color: destructive ? "#C8362F" : "#1C1C1E",
              fontWeight: "400",
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 13, color: "#9E9E9E", marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Sağ: custom element, değer+chevron, chevron, ya da hiçbir şey (destructive) */}
        {rightElement ? (
          <View style={{ marginLeft: 8 }}>{rightElement}</View>
        ) : value ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 17, color: "#9A9A9A" }}>{value}</Text>
            <ChevronRight size={18} color="#9A9A9A" strokeWidth={2} />
          </View>
        ) : destructive ? null : onPress ? (
          <ChevronRight size={18} color="#9A9A9A" strokeWidth={2} />
        ) : null}
      </Pressable>

      {/* Inset divider — son satırda yok */}
      {!last ? (
        <View style={{ height: 1, backgroundColor: "#F0F0F0", marginLeft: 16 }} />
      ) : null}
    </View>
  );
}
