import { View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { DayStat } from "@/lib/stats";
import { scoreColor } from "@/constants/colors";

interface Props {
  days: DayStat[];
  todayIndex?: number; // varsayılan: son gün
  height?: number;
}

export default function WeeklyChart({ days, todayIndex = 6, height = 120 }: Props) {
  const barWidth = 22;
  const gap = 10;
  const chartHeight = height;
  const chartWidth = days.length * barWidth + (days.length - 1) * gap;

  return (
    <View style={{ paddingVertical: 8 }}>
      <Svg width={chartWidth} height={chartHeight}>
        {days.map((d, i) => {
          const h = d.score > 0 ? (d.score / 100) * (chartHeight - 8) : 4;
          const y = chartHeight - h;
          const x = i * (barWidth + gap);
          const isToday = i === todayIndex;
          const fill = d.score > 0 ? scoreColor(d.score) : "#EEEEEE";
          return (
            <Rect
              key={d.date}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={6}
              fill={fill}
              stroke={isToday ? "#C73030" : "transparent"}
              strokeWidth={isToday ? 2 : 0}
            />
          );
        })}
      </Svg>

      {/* Gün etiketleri */}
      <View
        style={{
          flexDirection: "row",
          marginTop: 6,
          width: chartWidth,
        }}
      >
        {days.map((d, i) => (
          <View
            key={d.date}
            style={{
              width: barWidth,
              marginRight: i < days.length - 1 ? gap : 0,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: i === todayIndex ? "#C73030" : "#999",
                fontWeight: i === todayIndex ? "700" : "500",
              }}
            >
              {d.dayLabel}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
