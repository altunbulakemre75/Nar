import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Günlük tarama hatırlatması için yerel bildirim planlayıcı.
 * Ayarlar ekranındaki "Bildirimler" toggle'ı bunu kontrol eder.
 */

const CHANNEL_ID = "nar-daily";
const DAILY_ID_KEY = "nar-daily-reminder-id";
const DEFAULT_HOUR = 19; // 19:00

// Foreground'da da göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Günlük hatırlatma",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#C73030",
  });
}

export async function requestPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Her gün belirtilen saatte tekrarlayan hatırlatma planla.
 */
export async function scheduleDailyReminder(hour = DEFAULT_HOUR, minute = 0): Promise<void> {
  await ensureAndroidChannel();
  // Mevcut planı iptal et
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Nar",
      body: "Bugünkü yemeklerini eklemeyi unutma 🍎",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
      channelId: CHANNEL_ID,
    },
  });

  await AsyncStorage.setItem(DAILY_ID_KEY, id);
}

export async function cancelDailyReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(DAILY_ID_KEY);
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // zaten yok
    }
    await AsyncStorage.removeItem(DAILY_ID_KEY);
  }
}

/* --- Toggle durumu için zustand (persisted) --- */

interface NotifState {
  enabled: boolean;
  hour: number;
  setEnabled: (v: boolean) => void;
  setHour: (h: number) => void;
}

export const useNotifStore = create<NotifState>()(
  persist(
    (set) => ({
      enabled: false,
      hour: DEFAULT_HOUR,
      setEnabled: (enabled) => set({ enabled }),
      setHour: (hour) => set({ hour }),
    }),
    {
      name: "nar-notifications",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
