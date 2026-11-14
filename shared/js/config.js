/*
 * Dunia Sai: one place for games, prices, WhatsApp and promos.
 * The landing page (/), the launcher (/app/) and every promo page (/promo/<nama>) read this file.
 *
 * Change a price: edit `price` below (and the game's own SHOP/SALE setting inside its index.html).
 * Add a game: copy its files to /app/<id>/, add an entry to GAMES, run `node tools/kemas-kini.mjs`.
 */
(function (global) {
  const DS = {
    brand: 'Dunia Sai',
    company: 'SgieldSai',
    tagline: 'Setiap Permainan, Satu Ilmu',
    storyline: 'Bermula Dengan Jawi, Terus Meneroka',
    whatsapp: '601137865789',
    whatsappText: '011-3786 5789',
    itch: 'https://sgield.itch.io',

    // `lic` mirrors each game's own licence check, so the launcher can unlock games with one paste:
    //   store: the localStorage key the game reads its licence from
    //   v1:    product number for single-game codes (KJ1-, KA1-, WM1-, HS1-, WD1-, KM1-)
    //   pk1:   the game also opens with Pakej Semua Game (PK1-)
    //   pk2:   game number inside a PK2- bundle code
    // A game with no `lic` (and price 0) is free in full: no code needed.
    GAMES: [
      {
        id: 'kenal-jawi', name: 'Kenal Jawi', path: '/app/kenal-jawi/', img: '/img/kenal-jawi.jpg',
        subject: 'Jawi', age: '4 hingga 6 tahun', price: 9.9, pakej: true,
        desc: 'Kenal 37 huruf Jawi sambil bermain, dengan suara dan 8 permainan.',
        free: '17 huruf pertama',
        lic: { store: 'kj_licence', v1: 1, pk1: true, pk2: 1 },
      },
      {
        id: 'kenal-abc', name: 'Kenal ABC', path: '/app/kenal-abc/', img: '/img/kenal-abc.jpg',
        subject: 'Membaca', age: '4 hingga 6 tahun', price: 5, pakej: true,
        desc: 'Huruf A hingga Z dengan bunyi dan gambar, suku kata dan eja kata.',
        free: 'Huruf A hingga Q',
        lic: { store: 'abc_licence', v1: 2, pk1: true, pk2: 2 },
      },
      {
        id: 'wira-matematik', name: 'Wira Matematik', path: '/app/wira-matematik/', img: '/img/wira-matematik.jpg',
        subject: 'Matematik', age: '5 hingga 10 tahun', price: 9.9, pakej: true,
        desc: 'RPG matematik: 14 dunia, 42 pertempuran. Tambah, tolak, darab, bahagi, wang, masa, pecahan, ukuran dan data. BM dan English.',
        free: 'Dunia 1 hingga 5',
        lic: { store: 'wm_licence', v1: 3, pk1: true, pk2: 3 },
      },
      {
        id: 'hikayat-sungai', name: 'Hikayat Sungai Ilmu', path: '/app/hikayat-sungai/', img: '/img/hikayat-sungai.jpg',
        subject: 'Sains', age: '7 hingga 9 tahun', price: 9.9, pakej: true,
        desc: 'RPG sains bersama Sang Kancil, selari dengan Sains KSSR. BM dan English.',
        free: 'Bab 1',
        lic: { store: 'hikayat_licence', v1: 4, pk1: true, pk2: 4 },
      },
      {
        id: 'wonder-island', name: 'Wonder Island', path: '/app/wonder-island/', img: '/img/wonder-island.jpg',
        subject: 'English', age: '4 hingga 7 tahun', price: 14.9, pakej: true,
        desc: 'Belajar perkataan English melalui 22 mini game.',
        free: 'Dunia Explore (6 game)',
        lic: { store: 'wi_licence', v1: 5, pk1: true, pk2: 5 },
      },
      {
        id: 'kembara-malaysia', name: 'Kembara Malaysia Kita', path: '/app/kembara-malaysia/', img: '/img/kembara-malaysia.jpg',
        subject: 'Geografi', age: '6 hingga 10 tahun', price: 14.9, pakej: true,
        desc: 'Jelajah 16 destinasi Malaysia: bendera, warisan dan haiwan, dengan pasport dan sijil.',
        free: '4 negeri Zon Utara dan 3 arked',
        lic: { store: 'kmk_licence', v1: 6, pk2: 6 },
      },
      {
        id: 'boss-gerai', name: 'Boss Gerai', path: '/app/boss-gerai/', img: '/img/boss-gerai.jpg',
        subject: 'Duit dan niaga', age: '6 hingga 12 tahun', price: 9.9, pakej: true,
        desc: 'Buka gerai di 10 pasar Malaysia: gabung bahan, masak 60 menu di dapur dan kira baki duit pembeli.',
        free: '3 lokasi Kuala Lumpur',
        lic: { store: 'boss_gerai_lesen', pk2: 8 },
      },
      {
        id: 'ember-code', name: 'Ember Code', path: '/app/ember-code/', img: '/img/ember-code.jpg',
        subject: 'Koding', age: '5 hingga 15 tahun', price: 9.9, pakej: true,
        desc: 'Tower defence sambil belajar kod: corak, gelung, logik, hingga Python.',
        free: 'Peta 1 hingga 3',
        lic: { store: 'ember_code_lesen', pk2: 9 },
      },
      {
        // Game kedua dalam keluarga Ember Code (12 Nov 2026). Lesen PK2 nombor 9 yang sama dengan Ember Code:
        // sesiapa yang ada Ember Code (atau Pakej STEM / Semua 10 Game) terus dapat game ini. `sekali` = tiada harga berasingan.
        id: 'ember-mantera', name: 'Ember Code · Mantera Menara', path: '/app/ember-mantera/', img: '/img/ember-mantera.jpg',
        subject: 'Koding', age: '7 hingga 12 tahun', price: 9.9, pakej: true, sekali: 'ember-code',
        desc: 'Tower defence 15 peta: susun kad mantera JIKA, ULANG dan SASAR supaya menara berfikir sendiri, kemudian lihat kodnya dalam Python.',
        free: 'Bab 1 (peta 1 hingga 3)',
        lic: { store: 'ember_mantera_lesen', pk2: 9 },
      },
      {
        id: 'nakhoda-jawi', name: 'Nakhoda Jawi', path: '/app/nakhoda-jawi/', img: '/img/nakhoda-jawi.jpg',
        subject: 'Jawi lanjutan', age: '7 hingga 12 tahun', price: 14.9, pakej: true,
        desc: 'Belayar 18 pulau: 14 kaedah ejaan Jawi, 3 Mini Boss dan Pulau Lanun, dengan suara nakhoda BM dan kapal sendiri.',
        free: '7 pulau pertama',
        lic: { store: 'nakhoda_jawi_lesen', pk2: 10 },
      },
      {
        id: 'robot-rumble', name: 'Robot Rumble', path: '/app/robot-rumble/', img: '/img/robot-rumble.jpg',
        subject: 'Robotik dan fizik', age: '8 hingga 14 tahun', price: 9.9, pakej: true,
        desc: 'Bina robot, tulis kod dan uji di 25 misi: tork, geseran, sensor dan tenaga, dengan suara BEEP BM.',
        free: 'Misi M1 hingga M5',
        lic: { store: 'robot_rumble_lesen', pk2: 11 },
      },
      {
        // Percuma sepenuhnya: tiada `lic`, jadi launcher terus anggap versi penuh dan tidak minta kod
        id: 'lembah-embun', name: 'Lembah Embun', path: '/app/lembah-embun/', img: '/img/lembah-embun.jpg',
        subject: 'Santai dan Jawi', age: 'Semua umur', price: 0, pakej: true,
        desc: 'Ladang fantasi di kampung halaman: bertani, memancing, bela ayam dan tangkap kupu-kupu. Setiap barang yang ditemui tercatat dalam Kamus Kampung, Rumi dan Jawi.',
        free: 'Percuma sepenuhnya',
      },
      {
        // Percuma sepenuhnya (9 Nov 2026, Afiq). Lagu Eleven Music hanya dibenarkan kerana game ini percuma.
        id: 'awanara', name: 'AWANARA — The Living Isle', path: '/app/awanara/', img: '/img/awanara.jpg',
        subject: 'Santai dan rehat minda', age: 'Semua umur', price: 0, pakej: false,
        desc: 'Pulau terapung yang tenang di atas lautan awan: berkebun, bancuh teh untuk tetamu Cloudrest, alkimia ikut rentak dan Mod Zen. Tiada timer, tiada tekanan.',
        free: 'Percuma sepenuhnya',
      },
    ],

    // Signing key number -> Ed25519 public key, the same one inside every game. It can check codes, not make them.
    LICENCE_KEYS: { 2: 'QVgEegZrfviPeApvWbbbkzk3xI6ZKX0zKd2wEfy9pS0=' },

    // Pakej (2 Nov 2026, Afiq). Setiap pakej = satu kod PK2- dengan nombor game di `pk2` di atas.
    // Penjana lesen (/mnt/project-files/game/penjana-lesen-dunia-sai.html) ada senarai yang sama: ubah kedua-dua tempat.
    // Game percuma (tiada `lic`) tidak masuk mana-mana pakej.
    PAKEJ: {
      id: 'semua', name: 'Pakej Semua 10 Game', price: 50,
      games: ['kenal-jawi', 'kenal-abc', 'wira-matematik', 'hikayat-sungai', 'wonder-island', 'kembara-malaysia', 'boss-gerai', 'ember-code', 'nakhoda-jawi', 'robot-rumble'],
      note: '1 kod lesen buka kesemua 10 game berbayar Dunia Sai. Pembeli Pakej 5 Game sebelum ini dapat naik taraf percuma.',
    },
    PAKEJ_TEMA: [
      { id: 'tadika', name: 'Pakej Tadika', age: '4 hingga 6 tahun', price: 19.9,
        games: ['kenal-jawi', 'kenal-abc', 'wonder-island'], lead: 'Jawi, ABC dan English untuk anak prasekolah.' },
      { id: 'jawi', name: 'Pakej Jawi', age: '4 hingga 12 tahun', price: 19.9,
        games: ['kenal-jawi', 'nakhoda-jawi'], lead: 'Dari kenal huruf hingga 14 kaedah ejaan Jawi.' },
      { id: 'sekolah', name: 'Pakej Sekolah Rendah', age: '7 hingga 10 tahun', price: 29.9,
        games: ['wira-matematik', 'hikayat-sungai', 'kembara-malaysia', 'boss-gerai'], lead: 'Matematik, Sains, Geografi dan kira duit.' },
      { id: 'stem', name: 'Pakej STEM', age: '8 hingga 14 tahun', price: 19.9,
        games: ['ember-code', 'robot-rumble', 'boss-gerai'], lead: 'Koding, robotik dan niaga.' },
    ],

    // Promo campaigns, each live at /promo/<slug>. Dates are Malaysia time (+08:00).
    // `endsAt` is optional: without it the page shows no countdown.
    PROMOS: {
      // Slug lama dikekalkan supaya pautan iklan lama masih berfungsi; kini Pakej Semua 10 Game.
      'pakej-5-game': {
        title: 'Pakej Semua 10 Game',
        heading: 'Pakej Semua 10 Game',
        lead: 'Jawi, ABC, Matematik, Sains, English, Geografi, Duit, Koding dan Robotik dalam satu apps. 10 game, satu kod, RM50 sahaja.',
        price: 50,
        games: ['kenal-jawi', 'kenal-abc', 'wira-matematik', 'hikayat-sungai', 'wonder-island', 'kembara-malaysia', 'boss-gerai', 'ember-code', 'nakhoda-jawi', 'robot-rumble'],
        startsAt: '2026-10-26T00:00:00+08:00',
        points: [
          '1 kod lesen buka kesemua 10 game berbayar Dunia Sai',
          'Kod yang sama boleh dipakai di semua telefon, tablet dan komputer di rumah',
          'Bayar sekali, tiada langganan, tiada iklan',
          'Boleh dimainkan tanpa internet selepas dibuka kali pertama',
        ],
      },
    },
  };

  DS.waLink = (text) => `https://wa.me/${DS.whatsapp}?text=${encodeURIComponent(text)}`;
  DS.game = (id) => DS.GAMES.find((g) => g.id === id);
  DS.pakejGames = (P) => (P || DS.PAKEJ).games.map(DS.game).filter(Boolean);
  // Jumlah jika beli game dalam pakej satu-satu
  DS.pakejWorth = (P) => DS.pakejGames(P).reduce((a, g) => a + g.price, 0);
  // 9.9 -> "RM9.90", 50 -> "RM50"
  DS.rm = (n) => 'RM' + (Number.isInteger(n) ? String(n) : n.toFixed(2));

  global.DS = DS;
})(typeof window !== 'undefined' ? window : globalThis);
