import LegalPage, { H, P } from "@/components/LegalPage";

export default function About() {
  return (
    <LegalPage title="Hakkında" updatedAt="18 Nisan 2026">
      <P>
        Nar, Türkiye'nin ilk kişiselleştirilmiş gıda tarayıcı uygulamasıdır.
      </P>

      <H>Misyonumuz</H>
      <P>
        Herkesin ne yediğini bilmesi ve iyi hissetmesi. Türk gıda kültürüne ve damak tadına saygı
        duyarak, sana özel skorlama ve öneriler sunuyoruz.
      </P>

      <H>Neden Nar?</H>
      <P>
        Nar meyvesi Türk kültüründe bereketin ve sağlığın sembolüdür. Biz de uygulamamızın aynı
        şekilde bereket getirmesini umuyoruz.
      </P>

      <H>Nasıl çalışır?</H>
      <P>
        Ürünün barkodunu tara — Nar, hedeflerin ve sağlık durumuna göre 0-100 arası kişisel bir
        skor hesaplar. Sonra da gününü takip eder, haftalık özet çıkarır, başarılarını rozetle
        taçlandırır.
      </P>

      <H>Sürüm</H>
      <P>v0.1.0 (MVP)</P>

      <H>Ekip</H>
      <P>
        Nar Ankara'da bir geliştirici ve bir diyetisyen tarafından kuruldu. Geri bildirimlerinle
        büyüyoruz. destek@narapp.com
      </P>

      <H>Teşekkürler</H>
      <P>
        Sana, ürünü birlikte şekillendirdiğimiz ilk kullanıcılarımıza, ve tabii ki nara. 🌱
      </P>
    </LegalPage>
  );
}
