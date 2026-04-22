import { useRef, useState } from "react";
import { View, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { WaterCard } from "./WaterCard";
import { MoodCard } from "./MoodCard";
import { MealLogCard } from "./MealLogCard";

const WIDGETS = [
  { id: "water", C: WaterCard },
  { id: "mood", C: MoodCard },
  { id: "meals", C: MealLogCard },
];

export function WidgetPager() {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get("window");

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  return (
    <View style={{ marginTop: 4 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {WIDGETS.map(({ id, C }) => (
          <View key={id} style={{ width }}>
            <C />
          </View>
        ))}
      </ScrollView>

      {/* Sayfa göstergesi */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, gap: 6 }}>
        {WIDGETS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === page ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === page ? "#C73030" : "#D1D5DB",
            }}
          />
        ))}
      </View>
    </View>
  );
}
