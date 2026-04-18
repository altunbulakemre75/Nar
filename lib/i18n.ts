import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Lang = "tr" | "en";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

// İngilizce desteği şimdilik kapalı — lang her zaman "tr".
// setLang no-op: eski "en" değeri persist'te kalmış olsa bile
// initial state "tr" olacak (merge fonksiyonu ile).
export const useLangStore = create<LangState>()(
  persist(
    () => ({ lang: "tr" as Lang, setLang: (_l: Lang) => {} }),
    {
      name: "nar-lang",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (_persisted, current) => ({ ...current, lang: "tr" as Lang }),
    }
  )
);

type Dict = Record<string, string>;

const tr: Dict = {
  "common.cancel": "Vazgeç",
  "common.save": "Kaydet",
  "common.saving": "Kaydediliyor...",
  "common.error": "Hata",
  "common.retry": "Tekrar dene",
  "common.ok": "Tamam",
  "common.loading": "Yükleniyor...",
  "common.close": "Kapat",
  "common.skip": "Şimdilik atla",
  "common.edit": "Düzenle",
  "common.comingSoon": "Yakında",

  // Auth
  "auth.login.title": "Tekrar hoş geldin",
  "auth.login.subtitle": "Hesabına giriş yap ve taramaya devam et.",
  "auth.email": "E-posta",
  "auth.password": "Şifre",
  "auth.login.forgot": "Şifremi unuttum",
  "auth.login.submit": "Giriş yap",
  "auth.login.noAccount": "Hesabın yok mu? ",
  "auth.login.signup": "Kayıt ol",
  "auth.login.credentialsRequired": "E-posta ve şifre gerekli",
  "auth.signup.title": "Hesabını oluştur",
  "auth.signup.subtitle": "Saniyeler içinde kaydol, ne yediğini bilerek yaşa.",
  "auth.signup.name": "Adın",
  "auth.signup.namePlaceholder": "Ad Soyad",
  "auth.signup.passwordPlaceholder": "En az 8 karakter",
  "auth.signup.submit": "Kayıt ol",
  "auth.signup.hasAccount": "Zaten hesabın var mı? ",
  "auth.signup.login": "Giriş yap",
  "auth.signup.nameRequired": "Adını gir",
  "auth.signup.emailRequired": "E-posta gir",
  "auth.signup.passwordShort": "Şifre en az 8 karakter olmalı",
  "auth.forgot.title": "Şifremi unuttum",
  "auth.forgot.subtitle": "Kayıtlı e-posta adresine bir sıfırlama bağlantısı göndereceğiz.",
  "auth.forgot.submit": "Sıfırlama bağlantısı gönder",
  "auth.forgot.sent": "Gönderildi ✓",
  "auth.forgot.sentBody": "{email} adresine gelen e-postadaki bağlantıya tıkla.",
  "auth.forgot.backToLogin": "Giriş ekranına dön",

  // Home
  "home.todayScore": "Bugünün Skoru",
  "home.firstScan": "İlk ürününü tara",
  "home.itemsScanned": "{count} ürün tarandı bugün",
  "home.noScansToday": "Bugün henüz tarama yok",
  "home.unhealthy": "sağlıksız",
  "home.perfect": "mükemmel",
  "home.firstScanButton": "İlk Ürününü Tara",
  "home.scanButton": "Ürün Tara",
  "home.recent": "Son taradıkların",
  "home.score": "Skor",
  "home.deleteTitle": "Sil",
  "home.deleteBody": "Bu kaydı silmek istediğine emin misin?",

  // Profile
  "profile.title": "Profil",
  "profile.addName": "Adını ekle",
  "profile.memberSince": "{year} yılından beri üye",
  "profile.newMember": "Yeni üye",
  "profile.progress": "Takip edilen ilerleme",
  "profile.progressSubtitle": "{scans} tarama · {streak} gün streak",
  "profile.about": "Hakkında",
  "profile.goal": "Hedef",
  "profile.age": "Yaş",
  "profile.ageValue": "{age} yaşında",
  "profile.gender": "Cinsiyet",
  "profile.measurements": "Boy & Kilo",
  "profile.water": "Günlük Su Tüketimi",
  "profile.activity": "Aktivite Seviyesi",
  "profile.notSet": "Ayarlanmadı",
  "profile.preferences": "Tercihler",
  "profile.diet": "Diyet Kısıtlamaları",
  "profile.noDiet": "Diyet kısıtlaması yok",
  "profile.health": "Sağlık Durumları",
  "profile.noHealth": "Sağlık durumu belirtilmedi",
  "profile.allergies": "Alerjiler",
  "profile.noAllergies": "Alerji yok",
  "profile.favorites": "Favorilerim",
  "profile.favoritesCount": "{count} ürün",
  "profile.favoritesEmpty": "Henüz favori eklemedin",
  "profile.logout": "Çıkış yap",
  "profile.logoutConfirm": "Oturumu kapatmak istediğine emin misin?",

  // Settings
  "settings.title": "Ayarlar",
  "settings.premiumTitle": "Nar Premium",
  "settings.premiumDesc": "Sınırsız AI + fotoğraf analizi",
  "settings.premiumBadge": "YAKINDA",
  "settings.prefs": "Tercihler",
  "settings.notifications": "Bildirimler",
  "settings.notifications.on": "Her gün {hour}:00",
  "settings.notifications.off": "Kapalı",
  "settings.language": "Dil",
  "settings.langTurkish": "Türkçe",
  "settings.langEnglish": "English",
  "settings.langPickerTitle": "Dil seç",
  "settings.langPickerBody": "Uygulama dilini seç",
  "settings.data": "Veriler",
  "settings.export": "Verilerimi indir",
  "settings.deleteAccount": "Hesabı sil",
  "settings.support": "Destek",
  "settings.reportBug": "Hata bildir",
  "settings.rate": "Bize puan ver",
  "settings.privacy": "Gizlilik politikası",
  "settings.terms": "Kullanım koşulları",
  "settings.about": "Hakkında",
  "settings.logout": "Çıkış yap",
  "settings.version": "Nar v0.1.0",

  // Scan result
  "result.loading": "Ürün bulunuyor...",
  "result.servingSize": "Porsiyon: {size}g",
  "result.turkeyBadge": "🇹🇷 Türkiye'de satılıyor",
  "result.foreignBadge": "⚠️ Yurtdışı",
  "result.warningTitle": "Besin verisi eksik olabilir, skor tahminidir.",
  "result.noDataBody": "Veri yetersiz",
  "result.wellBalanced": "İyi Dengelenmiş",
  "result.toConsider": "Dikkat Edilmeli",
  "result.askNarci": "Narcı'ya Sor",
  "result.askBloat": "Bu ürün şişkinlik yapar mı?",
  "result.askAlternative": "Alternatif öner",
  "result.askHealthy": "Bu sağlıklı mı?",
  "result.addToDay": "Güne ekle",
  "result.cantAdd": "Eklenemez",
  "result.cantAddBody": "Bu ürünün besin değerleri eksik.",

  // Favorites
  "favorites.title": "Favorilerim",
  "favorites.empty": "Henüz favorin yok",
  "favorites.emptyBody":
    "Bir ürün taradığında sağ üstteki kalp ikonuna basarak favorilerine ekleyebilirsin.",

  // Premium
  "premium.title": "Nar Premium",
  "premium.subtitle": "Sınırsız AI sohbet, fotoğraf analizi ve detaylı raporlar.",
  "premium.cta": "Premium'a geç",
  "premium.monthly": "Aylık",
  "premium.yearly": "Yıllık",
  "premium.saveBadge": "58% tasarruf",
  "premium.yearlyTrial": "İlk 7 gün ücretsiz — istediğin zaman iptal et",
  "premium.monthlyTrial": "İlk 3 gün ücretsiz",
};

const en: Dict = {
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving...",
  "common.error": "Error",
  "common.retry": "Retry",
  "common.ok": "OK",
  "common.loading": "Loading...",
  "common.close": "Close",
  "common.skip": "Skip for now",
  "common.edit": "Edit",
  "common.comingSoon": "Coming soon",

  "auth.login.title": "Welcome back",
  "auth.login.subtitle": "Sign in and keep scanning.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.login.forgot": "Forgot password",
  "auth.login.submit": "Sign in",
  "auth.login.noAccount": "Don't have an account? ",
  "auth.login.signup": "Sign up",
  "auth.login.credentialsRequired": "Email and password are required",
  "auth.signup.title": "Create your account",
  "auth.signup.subtitle": "Sign up in seconds and know what you eat.",
  "auth.signup.name": "Name",
  "auth.signup.namePlaceholder": "Full name",
  "auth.signup.passwordPlaceholder": "At least 8 characters",
  "auth.signup.submit": "Sign up",
  "auth.signup.hasAccount": "Already have an account? ",
  "auth.signup.login": "Sign in",
  "auth.signup.nameRequired": "Enter your name",
  "auth.signup.emailRequired": "Enter your email",
  "auth.signup.passwordShort": "Password must be at least 8 characters",
  "auth.forgot.title": "Forgot password",
  "auth.forgot.subtitle": "We'll send a reset link to your registered email.",
  "auth.forgot.submit": "Send reset link",
  "auth.forgot.sent": "Sent ✓",
  "auth.forgot.sentBody": "Tap the link in the email sent to {email}.",
  "auth.forgot.backToLogin": "Back to sign in",

  "home.todayScore": "Today's Score",
  "home.firstScan": "Scan your first product",
  "home.itemsScanned": "{count} items logged today",
  "home.noScansToday": "No scans yet today",
  "home.unhealthy": "unhealthy",
  "home.perfect": "perfect",
  "home.firstScanButton": "Scan Your First Product",
  "home.scanButton": "Scan an Item",
  "home.recent": "Recent scans",
  "home.score": "Score",
  "home.deleteTitle": "Delete",
  "home.deleteBody": "Are you sure you want to delete this entry?",

  "profile.title": "Profile",
  "profile.addName": "Add your name",
  "profile.memberSince": "Member since {year}",
  "profile.newMember": "New member",
  "profile.progress": "Your Tracked Progress",
  "profile.progressSubtitle": "{scans} scans · {streak}-day streak",
  "profile.about": "About You",
  "profile.goal": "Goal",
  "profile.age": "Age",
  "profile.ageValue": "{age} years old",
  "profile.gender": "Gender",
  "profile.measurements": "Height & Weight",
  "profile.water": "Daily Water Intake",
  "profile.activity": "Activity Level",
  "profile.notSet": "Not set",
  "profile.preferences": "Preferences",
  "profile.diet": "Dietary Restrictions",
  "profile.noDiet": "No dietary restrictions",
  "profile.health": "Health Conditions",
  "profile.noHealth": "No health conditions listed",
  "profile.allergies": "Allergies",
  "profile.noAllergies": "No allergies",
  "profile.favorites": "My Favorites",
  "profile.favoritesCount": "{count} items",
  "profile.favoritesEmpty": "No favorites yet",
  "profile.logout": "Sign out",
  "profile.logoutConfirm": "Are you sure you want to sign out?",

  "settings.title": "Settings",
  "settings.premiumTitle": "Nar Premium",
  "settings.premiumDesc": "Unlimited AI + photo analysis",
  "settings.premiumBadge": "COMING",
  "settings.prefs": "Preferences",
  "settings.notifications": "Notifications",
  "settings.notifications.on": "Daily at {hour}:00",
  "settings.notifications.off": "Off",
  "settings.language": "Language",
  "settings.langTurkish": "Türkçe",
  "settings.langEnglish": "English",
  "settings.langPickerTitle": "Choose language",
  "settings.langPickerBody": "Select app language",
  "settings.data": "Data",
  "settings.export": "Export my data",
  "settings.deleteAccount": "Delete account",
  "settings.support": "Support",
  "settings.reportBug": "Report a bug",
  "settings.rate": "Rate us",
  "settings.privacy": "Privacy Policy",
  "settings.terms": "Terms of Use",
  "settings.about": "About",
  "settings.logout": "Sign out",
  "settings.version": "Nar v0.1.0",

  "result.loading": "Finding product...",
  "result.servingSize": "Serving: {size}g",
  "result.turkeyBadge": "🇹🇷 Sold in Turkey",
  "result.foreignBadge": "⚠️ International",
  "result.warningTitle": "Nutrition data may be incomplete, score is estimated.",
  "result.noDataBody": "Insufficient data",
  "result.wellBalanced": "Well Balanced",
  "result.toConsider": "To Consider",
  "result.askNarci": "Ask Narcı",
  "result.askBloat": "Will this cause bloating?",
  "result.askAlternative": "Suggest alternatives",
  "result.askHealthy": "Is this healthy?",
  "result.addToDay": "Log for today",
  "result.cantAdd": "Can't add",
  "result.cantAddBody": "This product is missing nutrition data.",

  "favorites.title": "My Favorites",
  "favorites.empty": "No favorites yet",
  "favorites.emptyBody":
    "Tap the heart on a product's scan result to save it here.",

  "premium.title": "Nar Premium",
  "premium.subtitle": "Unlimited AI chat, photo analysis and detailed reports.",
  "premium.cta": "Go Premium",
  "premium.monthly": "Monthly",
  "premium.yearly": "Yearly",
  "premium.saveBadge": "Save 58%",
  "premium.yearlyTrial": "First 7 days free — cancel anytime",
  "premium.monthlyTrial": "First 3 days free",
};

const DICTS: Record<Lang, Dict> = { tr, en };

function resolve(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  let text = DICTS[lang]?.[key] ?? DICTS.tr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}

/** React hook — bileşen içinde kullan */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) =>
    resolve(lang, key, vars);
}

/** Hook dışı (Alert, store vs. için) */
export function t(key: string, vars?: Record<string, string | number>): string {
  return resolve(useLangStore.getState().lang, key, vars);
}
