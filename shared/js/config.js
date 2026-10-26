/*
 * Dunia Sai — central configuration
 * ---------------------------------------------------------------
 * One file drives the landing page, the app launcher, the licence
 * engine and every promo page. To add a new learning app:
 *   1. create /app/<id>/index.html
 *   2. add an entry to MODULES below
 *   3. add its files to PRECACHE in /sw.js and bump VERSION
 */
(function (global) {
  const EDU_CONFIG = {
    brand: 'Dunia Sai',

    // TODO: replace with your real WhatsApp business number (country code, no + or spaces)
    whatsapp: '60123456789',

    // Learning modules shown in the launcher. `color` is a CSS custom property name in theme.css.
    MODULES: [
      {
        id: 'jawi',
        activities: 5, // starred activities, used for the progress bar
        name: 'Kenal Jawi',
        tagline: 'Kenal 37 huruf Jawi dan belayar bersama Nakhoda Jawi',
        path: '/app/jawi/',
        color: '--hijau',
        glyph: 'ج',
        glyphClass: 'jawi',
        level: 'Prasekolah & Tahun 1',
        // Shown free before a licence is activated
        trial: '10 huruf pertama dan pelayaran pertama',
      },
      {
        id: 'matematik',
        activities: 8, // starred activities, used for the progress bar
        name: 'Wira Matematik',
        tagline: 'Bingkai sepuluh dan ikatan nombor, dari konkrit ke abstrak',
        path: '/app/matematik/',
        color: '--biru',
        glyph: '10',
        level: 'Prasekolah & Tahun 1',
        trial: 'Nombor 1 hingga 5',
      },
      {
        id: 'abc',
        activities: 3, // starred activities, used for the progress bar
        name: 'Kenal ABC & Suku Kata',
        tagline: 'Huruf A hingga Z, suku kata KV dan KVK berwarna',
        path: '/app/abc/',
        color: '--merah',
        glyph: 'ba',
        glyphClass: 'kv',
        level: 'Prasekolah & Tahun 1',
        trial: 'Huruf A hingga Z dan perkataan KV+KV',
      },
      {
        id: 'kembara',
        activities: 4, // starred activities, used for the progress bar
        name: 'Kembara Malaysia',
        tagline: 'Negeri dan ibu negeri, serta kitar semula untuk bumi kita',
        path: '/app/kembara/',
        color: '--kuning',
        glyph: '🌏',
        level: 'Tahun 1 hingga 3',
        trial: 'Satu pusingan setiap aktiviti',
      },
    ],

    // Packages sold through WhatsApp. `modules` are unlocked by a licence with this `code`.
    // TODO: these prices are placeholders — set your real prices.
    PACKAGES: [
      {
        code: 'FULL',
        name: 'Pakej Lengkap',
        price: 79,
        was: 116,
        modules: ['jawi', 'matematik', 'abc', 'kembara'],
        note: 'Semua 4 aplikasi, untuk seisi rumah',
        featured: true,
      },
      { code: 'JAWI', name: 'Pakej Jawi', price: 29, modules: ['jawi'], note: '37 huruf, bentuk tunggal dan sambung' },
      { code: 'ABC', name: 'Pakej Membaca', price: 29, modules: ['abc'], note: 'ABC, suku kata KV dan KVK' },
      { code: 'MATH', name: 'Pakej Matematik', price: 29, modules: ['matematik'], note: 'Bingkai sepuluh hingga 20, ikatan nombor hingga 10' },
      { code: 'KEMB', name: 'Pakej Kembara', price: 29, modules: ['kembara'], note: 'Negeri Malaysia dan kitar semula' },
      // `hidden` packages are not listed on the landing page; use them for promo bundles.
      { code: 'BACA', name: 'Pakej Jawi + Membaca', price: 49, modules: ['jawi', 'abc'], note: 'Kenal Jawi dan Kenal ABC & Suku Kata', hidden: true },
    ],

    // Promo campaigns. Each one is live at /promo/<slug> (see _redirects).
    // Dates are ISO strings in Malaysia time (+08:00).
    PROMOS: {
      'cuti-sekolah': {
        title: 'Cuti sekolah, belajar sambil bermain',
        lead: 'Isi cuti hujung tahun dengan 4 aplikasi pembelajaran yang boleh dimain tanpa internet.',
        package: 'FULL',
        price: 59,
        code: 'CUTI26',
        startsAt: '2026-11-01T00:00:00+08:00',
        endsAt: '2027-01-03T23:59:59+08:00',
        tiles: ['cu', 'ti'],
        points: [
          'Main tanpa internet selepas dibuka kali pertama',
          'Satu lesen untuk semua peranti di rumah',
          'Bayaran sekali, tiada langganan',
        ],
      },
      'sedia-tahun-1': {
        title: 'Sedia ke Tahun 1',
        lead: 'Kukuhkan Jawi dan bacaan suku kata sebelum hari pertama persekolahan.',
        package: 'BACA',
        price: 45,
        code: 'TAHUN1',
        startsAt: '2026-11-15T00:00:00+08:00',
        endsAt: '2027-02-28T23:59:59+08:00',
        tiles: ['se', 'di', 'a'],
        points: [
          '37 huruf Jawi dalam bentuk tunggal dan sambung',
          'Suku kata KV dan KVK berwarna mengikut vokal',
          'Kemajuan disimpan untuk setiap anak',
        ],
      },
    },
  };

  global.EDU_CONFIG = EDU_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
