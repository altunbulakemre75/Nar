import LegalPage, { H, P } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Kullanım Koşulları" updatedAt="17 Nisan 2026">
      <P>
        Nar uygulamasını kullanarak aşağıdaki koşulları kabul etmiş olursun.
      </P>

      <H>Hizmet</H>
      <P>
        Nar, sana özel kişiselleştirilmiş gıda skorları ve beslenme içgörüleri sunar. Uygulama
        tıbbi tavsiye değildir, sadece bilgilendirme amaçlıdır.
      </P>

      <H>Sorumluluk reddi</H>
      <P>
        Skorlar ve öneriler eğitim amaçlıdır. Ciddi sağlık sorunların için doktoruna veya
        diyetisyenine danışmalısın. Uygulamadaki bilgilere dayanarak aldığın kararlardan Nar
        sorumlu değildir.
      </P>

      <H>Hesap güvenliği</H>
      <P>
        Hesabına erişim için kullanılan şifrenin güvenliğinden sen sorumlusun. Şüpheli bir
        durumla karşılaşırsan hemen şifreni değiştir.
      </P>

      <H>İçerik</H>
      <P>
        Uygulamaya yüklediğin içeriklerin sahibi sensin. Bu içerikleri uygulamanın düzgün
        çalışması için kullanma hakkımız var.
      </P>

      <H>Feshi</H>
      <P>
        Hesabını istediğin zaman silebilirsin. Kullanım koşullarını ihlal etmen halinde Nar
        hesabını askıya alma hakkını saklı tutar.
      </P>

      <H>Değişiklikler</H>
      <P>
        Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikleri sana bildireceğiz.
      </P>
    </LegalPage>
  );
}
