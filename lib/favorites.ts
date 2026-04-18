import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Local-only favoriler — barkod listesi.
 * Supabase tablosu gerektirmez; cihazda saklanır.
 */

interface FavoritesState {
  barcodes: string[];
  toggle: (barcode: string) => boolean; // sonuç: true=eklendi, false=çıkarıldı
  has: (barcode: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      barcodes: [],
      toggle: (barcode) => {
        const cur = get().barcodes;
        if (cur.includes(barcode)) {
          set({ barcodes: cur.filter((b) => b !== barcode) });
          return false;
        }
        set({ barcodes: [barcode, ...cur].slice(0, 200) });
        return true;
      },
      has: (barcode) => get().barcodes.includes(barcode),
      clear: () => set({ barcodes: [] }),
    }),
    {
      name: "nar-favorites",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
