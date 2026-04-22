import LegalPage, { H, P } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Gizlilik Politikası" updatedAt="18 Nisan 2026">
      <P>
        Nar Aura olarak gizliliğine önem veriyoruz. Bu politika, uygulamayı kullandığında hangi
        verilerini topladığımızı, nasıl kullandığımızı ve haklarını açıklar. Türkiye'de
        geçerli KVKK ve AB'de geçerli GDPR prensiplerine uygun işliyoruz.
      </P>

      <H>Veri sorumlusu</H>
      <P>
        Nar Aura uygulaması · destek@narapp.com. Veri işleme amacımız: sana kişiselleştirilmiş
        gıda skorları ve sağlık içgörüleri sunmak.
      </P>

      <H>Topladığımız veriler</H>
      <P>
        · Hesap bilgileri: e-posta adresin, adın (Supabase Auth üzerinden){"\n"}
        · Sağlık profili: yaş, cinsiyet, boy, kilo, aktivite seviyesi, hedef, sağlık
        koşulları, alerjiler, diyet tercihleri{"\n"}
        · Ürün taramaları: okuduğun barkodlar, hesaplanan skorlar, günlük özet{"\n"}
        · Cihaz verileri: kullandığın işletim sistemi, app sürümü, anonim kullanım
        istatistikleri{"\n"}
        · Bildirim izni: aldığın günlük hatırlatma zamanını yerel olarak saklıyoruz
      </P>

      <H>Verilerini nasıl kullanıyoruz</H>
      <P>
        · Sana özel skorlama ve öneriler sunmak için sağlık profilini algoritmada
        kullanıyoruz{"\n"}
        · Günlük ve haftalık takibini grafik olarak göstermek{"\n"}
        · Uygulamanın düzgün çalışmasını sağlamak ve hata ayıklamak{"\n"}
        · Ürünü geliştirmek için anonim kullanım metrikleri toplamak
      </P>

      <H>Üçüncü taraflar</H>
      <P>
        Verilerini asla satmıyoruz. Altyapı sağlayıcılarımız:{"\n"}
        · Supabase (Frankfurt, AB) — hesap ve veritabanı{"\n"}
        · Google Gemini API — Aura AI sohbetinde sorularını yanıtlar. Mesajların
        Google'ın veri saklama politikasına tabidir{"\n"}
        · Sentry — hata takibi (sadece teknik hata detayları){"\n"}
        · PostHog (Frankfurt, AB) — anonim kullanım analitiği{"\n"}
        · Open Food Facts — ürün barkod veritabanı (cevapsız kalmış ürünler için)
      </P>

      <H>Verilerin saklanması</H>
      <P>
        Hesap verilerin Supabase üzerinde AB (Frankfurt) bölgesinde saklanır. Favorilerin
        ve bildirim tercihlerin cihazında (AsyncStorage) yerel olarak tutulur.
      </P>

      <H>Haklarına</H>
      <P>
        KVKK ve GDPR kapsamında şu haklara sahipsin:{"\n"}
        · Verilerine erişim → Ayarlar › Verilerimi indir (JSON){"\n"}
        · Verilerini silme → Ayarlar › Hesabı sil{"\n"}
        · Düzeltme, işleme itiraz ve taşınabilirlik için: destek@narapp.com
      </P>

      <H>Çocuklar</H>
      <P>
        Nar Aura 13 yaş altı kullanıcıları hedeflememektedir. Çocuğunun izinsiz hesap
        açtığını düşünüyorsan bizimle iletişime geç.
      </P>

      <H>Değişiklikler</H>
      <P>
        Bu politikayı güncellediğimizde uygulama içi bildirim göndeririz. Önemli
        değişikliklerde açık rıza isteriz.
      </P>

      <H>İletişim</H>
      <P>Soruların, talep veya şikayetlerin için: destek@narapp.com</P>
    </LegalPage>
  );
}
