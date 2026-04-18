import * as Sentry from "@sentry/react-native";
import PostHog from "posthog-react-native";

// .env.local'de tanımla (EXPO_PUBLIC_ prefix ile runtime'a gelir)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let posthog: PostHog | null = null;
let initialized = false;

/**
 * App başlarken bir kez çağır (RootLayout useEffect'inde).
 * Env yoksa sessizce pas geçer — dev/test flow'u bozulmaz.
 */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 0 : 0.2,
      debug: __DEV__,
    });
  } else if (__DEV__) {
    console.log("[analytics] Sentry DSN yok — skip");
  }

  if (POSTHOG_KEY) {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      captureAppLifecycleEvents: true,
    });
  } else if (__DEV__) {
    console.log("[analytics] PostHog key yok — skip");
  }
}

export type AnalyticsEvent =
  | "app_opened"
  | "onboarding_completed"
  | "signup"
  | "login"
  | "logout"
  | "scan_not_found"
  | "scan_deleted"
  | "product_scanned"
  | "scan_added_to_day"
  | "narci_message_sent"
  | "achievement_unlocked"
  | "premium_cta_clicked"
  | "favorite_added"
  | "favorite_removed"
  | "goal_changed"
  | "weekly_stats_viewed";

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, any>
): void {
  if (__DEV__) console.log(`[track] ${event}`, properties ?? "");
  posthog?.capture(event, properties);
  Sentry.addBreadcrumb({
    category: "analytics",
    message: event,
    level: "info",
    data: properties,
  });
}

export function identifyUser(
  userId: string,
  traits?: Record<string, any>
): void {
  // PostHog: tüm trait'ler kullanıcı profiline gider (analytics için gerekli)
  posthog?.identify(userId, traits);
  // Sentry: SADECE user.id — email/PII Sentry event'lerine sızmasın
  Sentry.setUser({ id: userId });
}

export function resetUser(): void {
  posthog?.reset();
  Sentry.setUser(null);
}

export function reportError(error: unknown, context?: Record<string, any>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) console.error("[reportError]", err.message, context);
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
