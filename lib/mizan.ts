import type { HealthMode } from "@/types/database";

/**
 * Aktif sağlık modlarına göre Aura'ya ek prompt üretir.
 * Her mod ayrı ayrı eklenir, birleşik çalışır.
 */
export function buildHealthModePrompt(modes: HealthMode[]): string {
  if (!modes || modes.length === 0) return "";

  const parts: string[] = ["\nSAĞLIK DURUMU KURALLARI:"];

  if (modes.includes("glp1")) {
    parts.push(`
- GLP-1 KULLANIMI: Kullanıcı Ozempic/Mounjaro/Wegovy gibi bir ilaç kullanıyor. İştahı az, genelde yeterli yemiyor.
  ÖNCELİK: Protein yeterli mi? (günde 1.2-1.6g/kg)
  UYARI ver: Mikrobesin eksikliği (D vit, B12, demir, potasyum, lif)
  YAPMA: Kalori kısıtlama önerisi, "az yemişsin" eleştirisi
  YAP: "Az ama kaliteli" odak, protein önerisi, gerekirse takviye önerisi (doktor denetiminde)`);
  }

  if (modes.includes("diabet_1") || modes.includes("diabet_2")) {
    parts.push(`
- DİYABET: Kullanıcı diyabet hastası.
  ÖNCELİK: Glisemik indeks, karbonhidrat miktarı, öğün zamanlaması
  YAP: Lif + protein eşleşmesi vurgula (kan şekerini yavaşlatır)
  UYARI ver: Saat geç ise (22:00+) yüksek GI ürünlerde kısıtlama öner
  ASLA: İnsülin dozu söyleme, "bunu yersen şekerin şu olur" kesin yargısı`);
  }

  if (modes.includes("ibs")) {
    parts.push(`
- IBS: Kullanıcının sindirim hassasiyeti var.
  ÖNCELİK: FODMAP uyumu — soğan, sarımsak, baklagil, süt ürünü, buğday dikkat
  YAP: Geçmiş semptomlarla bağlantı kur ("Geçen X'ten sonra şişkinlik olmuştu")
  YAP: Porsiyon ve saate dikkat
  ASLA: Tanı koyma, ilaç önerisi`);
  }

  if (modes.includes("pcos")) {
    parts.push(`
- PCOS: İnsülin direnci ve hormonal hassasiyet var.
  ÖNCELİK: Düşük glisemik indeks, anti-enflamatuar gıdalar (omega-3, yeşil sebze)
  YAP: İnositol, magnezyum gibi takviyelerden bahsederken "doktoruna sor" ekle
  UYARI ver: Yüksek karbonhidrat + şeker kombinasyonunda
  ASLA: Kesin tıbbi tavsiye, hormon tedavisi önerisi`);
  }

  if (modes.includes("hamilelik")) {
    parts.push(`
- HAMİLELİK: Anne adayı ve bebek için güvenli beslenme.
  ÖNCELİK: Folik asit, demir, kalsiyum, D vitamini yeterliliği
  UYARI ver: Çiğ et, çiğ balık, pastörize edilmemiş süt, yüksek cıvalı balıklar (ton, kılıç)
  UYARI ver: Kafein limiti (200mg/gün = 1-2 fincan kahve)
  ASLA: Kilo verme önerisi, kısıtlayıcı diyet
  HER TAVSİYE SONRASI: "Kadın doğum uzmanınla da konuş"`);
  }

  if (modes.includes("emzirme")) {
    parts.push(`
- EMZİRME: Anne laktasyon döneminde.
  ÖNCELİK: +500 kcal/gün, bol sıvı, kalsiyum
  UYARI ver: Alkol kesin yok, kafein <300mg/gün
  YAP: Bebekte alerji belirtisi sorgula (süt, yumurta, fındık)
  ASLA: Kilo verme diyeti önerisi bu dönemde
  DOKTOR: "Pediatristin/doğum doktorunla paralel gidelim"`);
  }

  parts.push(`
GENEL KURAL: Bu bilgiler tıbbi tavsiye DEĞİLDİR. Bazen (her cevapta değil) "Tıbbi kararlar için doktorunla/diyetisyeninle konuş" ekle.`);

  return parts.join("\n");
}

/**
 * Tıbbi disclaimer — cevabın sonuna ~%30 olasılıkla ekler.
 */
export function maybeAddMedicalDisclaimer(hasHealthMode: boolean): string {
  if (!hasHealthMode) return "";
  if (Math.random() < 0.3) {
    return "\n\n💡 Bu Aura'nın görüşü. Tıbbi kararlar için doktorunla konuş.";
  }
  return "";
}
