import { Pressable, Text, ActivityIndicator, ViewStyle } from "react-native";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props {
  children: ReactNode;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: "#C73030", text: "#FFFFFF" },
  secondary: { bg: "#FFFFFF", text: "#111111", border: "#111111" },
  ghost: { bg: "transparent", text: "#C73030" },
};

export default function Button({
  children,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const s = STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDisabled ? "#E5B9B9" : s.bg,
          borderWidth: s.border ? 1.5 : 0,
          borderColor: s.border,
          opacity: variant === "ghost" && isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.text} />
      ) : (
        <Text style={{ color: s.text, fontSize: 16, fontWeight: "600" }}>{children}</Text>
      )}
    </Pressable>
  );
}
