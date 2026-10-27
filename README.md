# Dunia Sai

Satu laman, satu apps (PWA) untuk semua game belajar Dunia Sai oleh SgieldSai. Tiada build step: Cloudflare terus papar fail dalam repo ini setiap kali ada push ke `main`.

| Laluan | Isi |
| --- | --- |
| `/` | Laman utama: tentang Dunia Sai, 8 game dan harga, Pakej 5 Game, cara beli melalui WhatsApp |
| `/app/` | Apps (launcher): semua game, satu tempat masukkan kod lesen, simpan game untuk main tanpa internet |
| `/app/<game>/` | Game sebenar: `kenal-jawi`, `kenal-abc`, `wira-matematik`, `hikayat-sungai`, `wonder-island`, `kembara-malaysia`, `boss-gerai`, `ember-code`, `nakhoda-jawi`, `robot-rumble` |
| `/promo/<nama>` | Halaman promo dari `PROMOS` dalam `shared/js/config.js` (contoh `/promo/pakej-5-game`) |
| `/lesen`, `/beli`, `/main` | Pautan pendek untuk dikongsi |
| `/pantau/` | Tandakan phone pemilik supaya tidak dikira, dan pautan ke apps Pantau |

## Cara ia berfungsi

- **Satu apps.** `manifest.json` (scope `/`, mula di `/app/`) dan satu service worker `sw.js` meliputi semua game. Pembeli pasang sekali dan nampak semua game.
- **Main tanpa internet.** Kali pertama sesuatu game dibuka, `sw.js` simpan semua failnya (HTML dan audio). Selepas itu game dibuka terus dari simpanan, walaupun ada internet. Butang "Simpan offline" di `/app/` boleh simpan awal.
- **Kemas kini jimat data.** `files.json` senaraikan setiap fail dengan hash. Bila versi baharu keluar, hanya fail yang berubah dimuat turun semula.
- **Kod lesen sedia ada kekal sah.** Setiap game masih semak lesennya sendiri seperti dulu. `/app/` hanya semak kod dengan cara yang sama (`shared/js/lesen-lib.js` disalin dari game) dan simpan untuk setiap game yang kod itu buka. Satu kod `PK1-` buka 5 game pakej sekali gus. Kod lesen yang sah tidak akan ditulis ganti.
- **Butang 🏠** di tepi kiri setiap game membawa anak kembali ke senarai game (apps yang dipasang tiada butang back).

## Tugas biasa

**Tukar harga, nombor WhatsApp atau pakej:** sunting `shared/js/config.js` (`GAMES[].price`, `PAKEJ`, `whatsapp`). Harga di dalam game sendiri ada dalam tetapan `SHOP`/`SALE` dalam `app/<game>/index.html`.

**Kemas kini game:** salin `index.html` (dan folder `audio/` jika ada) versi baharu ke `app/<game>/`, kemudian jalankan:

```bash
node tools/kemas-kini.mjs
```

Skrip ini tambah butang 🏠, tulis semula `files.json` dan naikkan `VERSION` dalam `sw.js`. Commit semua fail yang berubah.

**Tambah game baharu:** salin ke `app/<id>/`, tambah satu entri dalam `GAMES` di `config.js` (termasuk `lic.store`, kunci localStorage yang game itu guna), tambah gambar kad di `img/<id>.jpg`, jalankan `node tools/kemas-kini.mjs`.

**Lancar promo:** tambah entri dalam `PROMOS` di `config.js`. Ia terus hidup di `/promo/<slug>`. `endsAt` pilihan; jika ada, halaman tunjuk kiraan detik.

**Nama anak:** ibu bapa tulis nama anak sekali di `/app/` (boleh tambah dan tukar antara beberapa anak). Ia disimpan dalam peranti sahaja (`localStorage` `ds_anak`, `shared/js/anak.js`). Muka depan Kenal Jawi, Kenal ABC, Wira Matematik, Hikayat Sungai Ilmu dan Wonder Island menyapa anak dengan nama itu, dan sijil Kenal Jawi serta Kenal ABC terisi sendiri. Kemajuan permainan masih satu untuk setiap peranti, bukan berasingan untuk setiap anak. Pautan `https://<domain>/app/?nama=Aisyah` terus simpan nama. Jika game ini dikemas kini dari fail asal, tambah semula baris bertanda `Dunia Sai:` dalam game tersebut.

**Pautan lesen satu sentuhan:** hantar `https://<domain>/app/?lesen=<KOD>` kepada pembeli; kod diaktifkan bila pautan dibuka.

## Pantau pelawat (`/pantau/`)

`shared/js/jejak.js` (dimuat di semua halaman, dan dalam game melalui `balik.js`) hantar kiraan tanpa nama ke `/api/jejak`: lawatan halaman, game dibuka, game dimain (anak betul-betul tekan skrin), masa bermain dan tekan butang WhatsApp. Tiada nama, kod lesen, cookie atau IP disimpan; pelawat dikira dengan hash yang bertukar setiap hari. Acara semasa offline disimpan dan dihantar bila ada internet.

Data disimpan dalam Cloudflare D1 oleh Pages Functions (`functions/api/`). Ia hanya berfungsi di Cloudflare **Pages**. Persediaan sekali sahaja:

1. Cloudflare > Storage & Databases > D1 > Create database, nama `dunia-sai-pantau`.
2. Workers & Pages > projek `dunia-sai` > Settings > Bindings > Add > D1 database: nama pembolehubah `DB`, pilih `dunia-sai-pantau`.
3. Settings > Variables and Secrets > Add: jenis Secret, nama `PANTAU_KUNCI`, nilai kata laluan panjang pilihan anda.
4. Deployments > deploy semula `main` (binding hanya aktif selepas deploy baharu).

**Apps Pantau** (folder `pantau-app/`) ialah projek Cloudflare Pages kedua dari repo yang sama, supaya ia boleh dipasang sebagai apps berasingan dengan ikon sendiri: Create > Pages > sambung repo ini, nama projek `pantau-dunia-sai`, framework None, build command kosong, build output directory `/`, root directory `pantau-app`. Jika root directory tidak berkesan, `functions/_middleware.js` tetap jawab alamat `pantau-dunia-sai.pages.dev` dari folder `pantau-app/` (hanya laluan dalam `_routes.json` melalui fungsi itu). Ia baca nombor dari `https://dunia-sai.pages.dev/api/pantau`, jadi tiada binding diperlukan di projek kedua. Jika nama projek lain, tukar `PANTAU_URL` dalam `pantau/index.html`.

Buka `https://dunia-sai.pages.dev/pantau/` sekali di setiap phone atau tablet anda: lawatan dari peranti itu tidak akan dikira.

Jadual dicipta sendiri pada acara pertama. Acara lebih lama dari 400 hari dipadam automatik.

## Deploy di Cloudflare

Repo ini boleh dipapar sebagai Cloudflare Pages (sambung repo, framework None, tiada build command, output directory `/`) atau Workers static assets (`wrangler.jsonc`, deploy command `npx wrangler deploy`). `_redirects` dan `_headers` berfungsi pada kedua-duanya.

Had Cloudflare: 25 MiB satu fail. Fail paling besar ialah Wonder Island (~20 MB).

## Nota

- Kemajuan anak dan lesen disimpan dalam pelayar setiap peranti. Kod yang dimasukkan di sgield.pages.dev atau itch.io tidak terbawa ke domain baharu, jadi pembeli lama perlu tampal kod sekali lagi di `/app/`.
- Laluan lama Sgield (`/kenal-jawi/` dan lain-lain) dihalakan ke `/app/<game>/`.
