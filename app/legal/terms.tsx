import LegalPage, { H, P } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Kullanım Koşulları" updatedAt="18 Nisan 2026">
      <P>
        Nar uygulamasını kullanarak aşağıdaki koşulları kabul etmiş olursun. Bu koşullara
        katılmıyorsan uygulamayı kullanmayı bırak.
      </P>

      <H>Hizmet</H>
      <P>
        Nar; barkod tarama, ürünleri kişiselleştirilmiş bir skorla puanlama, günlük ve
        haftalık beslenme takibi, AI destekli beslenme sohbeti (Narcı) ve besin etiketi
        OCR analizi hizmeti sunar. Uygulama tıbbi bir cihaz veya tıbbi tavsiye değildir.
      </P>

      <H>Sorumluluk reddi</H>
      <P>
        Skorlar ve öneriler eğitim amaçlıdır; bir doktor veya diyetisyen görüşünün yerine
        geçmez. Kronik hastalığın varsa, hamile/emziren anneysen veya ciddi sağlık
        kararları alıyorsan bir uzmana danışman gerekir. Uygulamadaki içeriklere dayanarak
        aldığın kararların sonuçlarından Nar sorumlu tutulamaz.
      </P>

      <H>Hesap güvenliği</H>
      <P>
        Hesabına erişim için kullanılan şifrenin güvenliğinden sen sorumlusun. Şüpheli bir
        giriş fark edersen hemen şifreni değiştir ve bizimle iletişime geç.
      </P>

      <H>Kullanıcı içeriği</H>
      <P>
        Uygulamaya yüklediğin içeriklerin (etiket fotoğrafları, sorular vb.) sahibi sensin.
        Bu içerikleri uygulamanın düzgün çalışması için işleme hakkı bize tanırsın.
      </P>

      <H>Yasaklı kullanım</H>
      <P>
        Uygulamayı otomatik araçlarla kötüye kullanma, başkasının hesabına izinsiz erişme,
        tersine mühendislik yapma veya hizmeti bozmaya çalışma yasaktır. Bu durumda hesabını
        askıya alabilir veya silebiliriz.
      </P>

      <H>Nar Premium aboneliği</H>
      <P>
        · Aylık 99₺ veya yıllık 499₺ fiyatla sunulur{"\n"}
        · Ödeme Apple App Store / Google Play üzerinden alınır{"\n"}
        · Abonelik otomatik yenilenir. İptal için Apple ID / Google hesabının abonelik
        ayarlarını kullan. En geç bir sonraki yenileme tarihinden 24 saat önce iptal et{"\n"}
        · Deneme süresi içinde iptal etmezsen ücretlendirmeye dönüşür{"\n"}
        · Premium iade taleplerine Apple/Google politikaları uygulanır
      </P>

      <H>Ücretsiz kullanım</H>
      <P>
        Uygulamanın temel özellikleri (barkod tarama, skorlama, günlük takip) ücretsizdir.
        AI sohbet ve fotoğraf analizi gibi özellikler için adil kullanım limitleri
        uygulanabilir.
      </P>

      <H>Feshi</H>
      <P>
        Hesabını istediğin zaman Ayarlar › Hesabı sil bölümünden silebilirsin. Biz de bu
        koşulların ihlali durumunda hesabını bildirimsiz askıya alma veya silme hakkını
        saklı tutarız.
      </P>

      <H>Uygulanacak hukuk</H>
      <P>
        Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda İstanbul
        mahkemeleri ve icra daireleri yetkilidir.
      </P>

      <H>Değişiklikler</H>
      <P>
        Bu koşulları zaman zaman güncelleyebiliriz. Önemli değişiklikleri uygulama içi
        bildirim veya e-posta ile haberdar ederiz.
      </P>

      <H>İletişim</H>
      <P>Her türlü soru için: destek@narapp.com</P>
    </LegalPage>
  );
}
