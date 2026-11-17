# rr-bilik: server bilik multiplayer Robot Rumble 2D + 3D

Cloudflare Worker + Durable Object `Bilik`. Berasingan daripada laman Dunia Sai (folder ini tidak diterbitkan ke laman; lihat `.assetsignore`).

- `GET /` : semakan hidup
- `POST /bilik/baru` : cipta kod bilik 4 huruf (tanpa vokal)
- `GET /bilik/{KOD}/ws` : WebSocket bilik (maksimum 8 pemain)

Jenis bilik ditetapkan oleh pemain pertama: `3d` = lumba serentak, `2d` = Pertandingan Rekacipta (hos pilih misi + 2–10 minit, setiap ujian lulus dihantar sebagai kod larian, kemudian lumba akhir; setiap peranti sahkan masa dengan main semula). Pemain 2D tidak boleh masuk bilik 3D dan sebaliknya.

Keselamatan kanak-kanak: tiada chat teks, nama ditapis (huruf/nombor, 12 aksara), emoji tetap sahaja. Server tidak menyimpan data pemain selepas bilik kosong.

## Deploy (sekali sahaja)
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → pilih repo ini.
2. **Project name**: `rr-bilik`. **Root directory**: `servers/rr-bilik`. Build command kosong, deploy command `npx wrangler deploy`.
3. Selepas deploy, salin URL `https://rr-bilik.<akaun>.workers.dev` dan letak dalam `DEFAULT_SERVER` dalam `bilik.js` game 3D.

Uji setempat: `npx wrangler@3 dev` dalam folder ini.
