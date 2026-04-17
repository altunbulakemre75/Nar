import { View, Text } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

/**
 * Nar logosu — küçük bir nar ikonu + "Nar" metni.
 * size: logo ikonu çapı (default 56). Metin ona göre orantılı.
 */
export default function NarLogo({
  size = 56,
  showTagline = true,
  color = "#C73030",
}: {
  size?: number;
  showTagline?: boolean;
  color?: string;
}) {
  const textSize = size;
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pomegranate size={size * 0.75} color={color} />
        <Text
          style={{
            fontFamily: "PlayfairDisplay-BoldItalic",
            fontSize: textSize,
            color,
            lineHeight: textSize * 1.1,
          }}
        >
          Nar
        </Text>
      </View>
      {showTagline ? (
        <Text style={{ marginTop: 6, fontSize: 13, color: "#6B1A1A", letterSpacing: 0.3 }}>
          Ne yediğini bil
        </Text>
      ) : null}
    </View>
  );
}

function Pomegranate({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 64 64">
      <G>
        {/* Gövde */}
        <Path
          d="M32 56 C16 56 10 42 12 28 C13 18 20 10 32 10 C44 10 51 18 52 28 C54 42 48 56 32 56 Z"
          fill={color}
        />
        {/* Tepe — taç */}
        <Path
          d="M28 10 L32 2 L36 10 Z"
          fill={color}
        />
        <Path d="M30 6 L34 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        {/* Parlaklık */}
        <Circle cx={24} cy={22} r={2.2} fill="#FFFFFF" opacity={0.55} />
        {/* İç taneler (dekoratif) */}
        <Circle cx={26} cy={34} r={1.6} fill="#FFFFFF" opacity={0.25} />
        <Circle cx={32} cy={38} r={1.6} fill="#FFFFFF" opacity={0.25} />
        <Circle cx={38} cy={34} r={1.6} fill="#FFFFFF" opacity={0.25} />
        <Circle cx={29} cy={42} r={1.4} fill="#FFFFFF" opacity={0.25} />
        <Circle cx={35} cy={42} r={1.4} fill="#FFFFFF" opacity={0.25} />
      </G>
    </Svg>
  );
}
