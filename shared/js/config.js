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
    GAMES: [
      {
        id: 'kenal-jawi', name: 'Kenal Jawi', path: '/app/kenal-jawi/', img: '/img/kenal-jawi.jpg',
        subject: 'Jawi', age: '4 hingga 6 tahun', price: 15, pakej: true,
        desc: 'Kenal 37 huruf Jawi sambil bermain, dengan suara dan 8 permainan.',
        free: '10 huruf pertama',
        lic: { store: 'kj_licence', v1: 1, pk1: true },
      },
      {
        id: 'kenal-abc', name: 'Kenal ABC', path: '/app/kenal-abc/', img: '/img/kenal-abc.jpg',
        subject: 'Membaca', age: '4 hingga 6 tahun', price: 5, pakej: true,
        desc: 'Huruf A hingga Z dengan bunyi dan gambar, suku kata dan eja kata.',
        free: 'Huruf A hingga J',
        lic: { store: 'abc_licence', v1: 2, pk1: true },
      },
      {
        id: 'wira-matematik', name: 'Wira Matematik', path: '/app/wira-matematik/', img: '/img/wira-matematik.jpg',
        subject: 'Matematik', age: '5 hingga 10 tahun', price: 15, pakej: true,
        desc: 'RPG matematik: jawab betul, tewaskan raksasa. Tambah, tolak, darab, bahagi. BM dan English.',
        free: 'Tanah 1 dan 2',
        lic: { store: 'wm_licence', v1: 3, pk1: true },
      },
      {
        id: 'hikayat-sungai', name: 'Hikayat Sungai Ilmu', path: '/app/hikayat-sungai/', img: '/img/hikayat-sungai.jpg',
        subject: 'Sains', age: '7 hingga 9 tahun', price: 15, pakej: true,
        desc: 'RPG sains bersama Sang Kancil, selari dengan Sains KSSR. BM dan English.',
        free: 'Bab 1',
        lic: { store: 'hikayat_licence', v1: 4, pk1: true },
      },
      {
        id: 'wonder-island', name: 'Wonder Island', path: '/app/wonder-island/', img: '/img/wonder-island.jpg',
        subject: 'English', age: '4 hingga 7 tahun', price: 20, pakej: true,
        desc: 'Belajar perkataan English melalui 22 mini game.',
        free: 'Dunia Explore (6 game)',
        lic: { store: 'wi_licence', v1: 5, pk1: true },
      },
      {
        id: 'kembara-malaysia', name: 'Kembara Malaysia Kita', path: '/app/kembara-malaysia/', img: '/img/kembara-malaysia.jpg',
        subject: 'Geografi', age: '6 hingga 10 tahun', price: 20, pakej: false,
        desc: 'Jelajah 16 destinasi Malaysia: bendera, warisan dan haiwan, dengan pasport dan sijil.',
        free: '4 negeri Zon Utara dan 3 arked',
        lic: { store: 'kmk_licence', v1: 6, pk2: 6 },
      },
      {
        id: 'boss-gerai', name: 'Boss Gerai', path: '/app/boss-gerai/', img: '/img/boss-gerai.jpg',
        subject: 'Duit dan niaga', age: '6 hingga 12 tahun', price: 15, pakej: false,
        desc: 'Buka gerai pasar malam: ambil pesanan 3 bahasa, masak, kira baki duit dan urus stok.',
        free: '3 lokasi Kuala Lumpur',
        lic: { store: 'boss_gerai_lesen', pk2: 8 },
      },
      {
        id: 'ember-code', name: 'Ember Code', path: '/app/ember-code/', img: '/img/ember-code.jpg',
        subject: 'Koding', age: '5 hingga 15 tahun', price: 15, pakej: false,
        desc: 'Tower defence sambil belajar kod: corak, gelung, logik, hingga Python.',
        free: 'Peta 1 hingga 3',
        lic: { store: 'ember_code_lesen', pk2: 9 },
      },
    ],

    // Signing key number -> Ed25519 public key, the same one inside every game. It can check codes, not make them.
    LICENCE_KEYS: { 2: 'QVgEegZrfviPeApvWbbbkzk3xI6ZKX0zKd2wEfy9pS0=' },

    PAKEJ: {
      name: 'Pakej 5 Game',
      price: 60,          // harga biasa
      promo: 50,          // harga promo, set null bila promo tamat
      promoNote: 'untuk 50 pembeli terawal',
      worth: 70,          // jumlah jika beli 5 game satu-satu
      note: 'Kenal ABC percuma dalam pakej. Satu kod lesen (PK1-) buka kelima-lima game.',
    },

    // Promo campaigns, each live at /promo/<slug>. Dates are Malaysia time (+08:00).
    // `endsAt` is optional: without it the page shows no countdown.
    PROMOS: {
      'pakej-5-game': {
        title: 'Pakej 5 Game, harga promo',
        lead: 'Jawi, ABC, Matematik, Sains dan English dalam satu apps. Harga promo untuk 50 pembeli terawal sahaja.',
        price: 50,
        was: 60,
        games: ['kenal-jawi', 'kenal-abc', 'wira-matematik', 'hikayat-sungai', 'wonder-island'],
        startsAt: '2026-10-26T00:00:00+08:00',
        points: [
          'Satu kod lesen untuk semua telefon, tablet dan komputer di rumah',
          'Bayar sekali, tiada langganan, tiada iklan',
          'Boleh dimainkan tanpa internet selepas dibuka kali pertama',
        ],
      },
    },
  };

  DS.waLink = (text) => `https://wa.me/${DS.whatsapp}?text=${encodeURIComponent(text)}`;
  DS.pakejGames = () => DS.GAMES.filter((g) => g.pakej);

  global.DS = DS;
})(typeof window !== 'undefined' ? window : globalThis);
