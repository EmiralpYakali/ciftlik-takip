# İbrahim Müdürün Çiftliği

Koyunların küpe numarası, yaşı, kilosu, ırkı, sağlık durumu, kullanılan ilaçları ve notlarını takip etmek için hazırlanmış kurumsal çiftlik yönetim paneli.

## Özellikler

- 364 hayvanlık başlangıç sürüsü
- Küpe numarasıyla anlık arama (`T1111` gibi)
- Koyun ekleme, düzenleme ve silme
- Yaş, kilo, ırk, cinsiyet, ilaç ve sağlık kayıtları
- Son güncelleme tarihleri
- Telefon ve masaüstü uyumlu arayüz
- Cloudflare D1 üzerinde kalıcı veritabanı

## Bilgisayarda çalıştırma

Node.js 22.13 veya daha yeni bir sürüm gereklidir.

```bash
npm install
npm run dev
```

Ardından `http://localhost:3000` adresini açın.

## GitHub üzerinden yayınlama

Bu proje kalıcı veritabanı kullandığı için yalnızca GitHub Pages ile çalışmaz. GitHub deponuzu Cloudflare Workers'a bağlayın:

1. Cloudflare panelinde bir D1 veritabanı oluşturun.
2. Oluşan veritabanı kimliğini `wrangler.jsonc` içindeki `database_id` alanına yazın.
3. Şemayı uygulayın: `npx wrangler d1 migrations apply ibrahim-ciftligi-db --remote`
4. Cloudflare Workers & Pages bölümünde **Import a repository** ile GitHub deponuzu seçin.
5. Kurulum komutu `npm install`, yayın komutu `npm run deploy` olsun.
6. İsterseniz `PUBLIC_SITE_URL` değerini canlı site adresiniz olarak ekleyin.

İlk açılışta veritabanı otomatik olarak 364 örnek koyun kaydıyla hazırlanır.

