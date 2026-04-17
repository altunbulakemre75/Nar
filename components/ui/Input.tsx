import { useState } from "react";
import { View, Text, TextInput, Pressable, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface Props extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string | null;
  secureTextEntry?: boolean;
}

export default function Input({
  label,
  error,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const borderColor = error ? "#C73030" : focused ? "#C73030" : "#E5E7EB";

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFF",
          borderWidth: 1.5,
          borderColor,
          borderRadius: 14,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor="#BBB"
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 16,
            color: "#111",
          }}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={8} style={{ padding: 6 }}>
            {hidden ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{ marginTop: 6, fontSize: 12, color: "#C73030" }}>{error}</Text>
      ) : null}
    </View>
  );
}
