import LegalPage, { H, P } from "@/components/LegalPage";

export default function About() {
  return (
    <LegalPage title="Hakkında" updatedAt="18 Nisan 2026">
      <P>
        Nar Aura, Türkiye'nin ilk kişiselleştirilmiş AI beslenme koçu uygulamasıdır.
      </P>

      <H>Misyonumuz</H>
      <P>
        Herkesin ne yediğini bilmesi ve iyi hissetmesi. Türk gıda kültürüne ve damak tadına saygı
        duyarak, sana özel skorlama ve öneriler sunuyoruz.
      </P>

      <H>Neden Nar Aura?</H>
      <P>
        Nar meyvesi Türk kültüründe bereketin ve sağlığın sembolüdür. "Aura" ise seni saran
        kişisel enerjin demek — Nar Aura, bu ikisini birleştiren yerli bir beslenme koçudur.
      </P>

      <H>Nasıl çalışır?</H>
      <P>
        Ürünün barkodunu tara — Nar Aura, hedeflerin ve sağlık durumuna göre 0-100 arası
        kişisel bir skor verir ve Narcı asistan sana özel öneri sunar. Gününü takip eder,
        haftalık özet çıkarır, başarılarını rozetle taçlandırır.
      </P>

      <H>Sürüm</H>
      <P>v0.1.0 (MVP)</P>

      <H>Ekip</H>
      <P>
        Nar Aura, bir solo geliştirici tarafından Türkiye için yapıldı. Amaç: yabancı
        uygulamaların anlamadığı Türk yemek kültürü, sağlık problemleri ve duygusal yaklaşım.
        Geri bildirimlerinle büyüyoruz. destek@narapp.com
      </P>

      <H>Teşekkürler</H>
      <P>
        Sana, ürünü birlikte şekillendirdiğimiz ilk kullanıcılarımıza, ve tabii ki nara. 🌱
      </P>
    </LegalPage>
  );
}
