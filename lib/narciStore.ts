import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface NarciChatState {
  messages: Message[];
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => Message;
  clearHistory: () => void;
}

export const useNarciStore = create<NarciChatState>()(
  persist(
    (set, get) => ({
      messages: [],

      addMessage: (msg) => {
        const full: Message = {
          ...msg,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
        };
        // Son 50 mesajı tut
        const all = [...get().messages, full].slice(-50);
        set({ messages: all });
        return full;
      },

      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: "nar-narci-chat",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
