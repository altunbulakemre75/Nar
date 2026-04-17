import LegalPage, { H, P } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Gizlilik Politikası" updatedAt="17 Nisan 2026">
      <P>
        Nar olarak gizliliğine önem veriyoruz. Bu politika, uygulamayı kullandığında hangi
        verilerini topladığımızı ve nasıl kullandığımızı açıklar.
      </P>

      <H>Topladığımız veriler</H>
      <P>
        Hesap oluştururken e-posta adresin ve adın; onboarding'de yaş, cinsiyet, boy, kilo,
        aktivite seviyesi, sağlık koşulları, alerjiler ve diyet tercihlerin; taradığın ürünler ve
        skorların.
      </P>

      <H>Verilerini nasıl kullanıyoruz</H>
      <P>
        · Sana özel skorlama ve öneriler sunmak{"\n"}
        · Günlük ve haftalık takibini göstermek{"\n"}
        · Uygulamanın düzgün çalışmasını sağlamak
      </P>

      <H>3. taraflarla paylaşım</H>
      <P>
        Verilerini asla satmıyoruz. Sadece altyapı sağlayıcılarımızla (Supabase) ve sen izin
        verirsen AI sohbet için OpenAI/Google Gemini ile paylaşıyoruz.
      </P>

      <H>Haklarına</H>
      <P>
        Verilerini istediğin zaman dışa aktarabilir, hesabını silebilirsin. Ayarlar ekranından
        yapabilirsin veya destek@narapp.com ile iletişime geçebilirsin.
      </P>

      <H>İletişim</H>
      <P>Soruların için: destek@narapp.com</P>
    </LegalPage>
  );
}
