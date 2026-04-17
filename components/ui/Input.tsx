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

  const borderColor = error ? "#C73030" : focused ? "#C73030" : "#DDDDDD";

  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-xs mb-1.5" style={{ color: "#666", fontWeight: "500" }}>
          {label}
        </Text>
      ) : null}

      <View className="flex-row items-center" style={{ borderBottomWidth: 1.5, borderBottomColor: borderColor }}>
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
            paddingVertical: 10,
            fontSize: 16,
            color: "#111",
          }}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={8} className="pl-2 py-2">
            {hidden ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs" style={{ color: "#C73030" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
