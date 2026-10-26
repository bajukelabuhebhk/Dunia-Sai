# Dunia Sai

Public landing page, a central PWA launcher and four offline learning apps, deployed as one Cloudflare Pages site. No build step.

| Path | What it is |
| --- | --- |
| `/` | Landing page: DBP/KSPK/KSSR alignment, packages, WhatsApp checkout |
| `/app/` | Launcher: one card per app, licences, settings, backup |
| `/app/jawi/` | Kenal Jawi (37 DBP letters, 4 forms) and Nakhoda Jawi quiz |
| `/app/matematik/` | Wira Matematik: ten-frames (CPA) and number bonds |
| `/app/abc/` | Kenal ABC, KV/KVK syllables, word building |
| `/app/kembara/` | Negeri Malaysia quiz and recycling bins |
| `/promo/<slug>` | Any campaign from `PROMOS`, rendered by `promo/template.html` |

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick `sgield-eduplay`.
2. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
3. Save and deploy. Add your custom domain under the project's Custom domains tab.

`_redirects` handles promo URLs and `_headers` keeps `sw.js` uncached.

## Everyday tasks

**Change prices, WhatsApp number or packages** — edit `shared/js/config.js` (`whatsapp`, `PACKAGES`).

**Launch a promo** — add an entry to `PROMOS` in `shared/js/config.js`. It goes live at `/promo/<slug>` between `startsAt` and `endsAt`, with a countdown. `/promo` lists the campaigns running now.

**Issue a licence after payment**
```bash
node tools/keygen.mjs FULL 1        # FULL, JAWI, ABC, MATH, KEMB, BACA
```
Send the buyer the key, or a link that activates it in one tap:
`https://<your-domain>/app/?lesen=SAI-FULL-XXXX-XX`

**Add a new app** — create `app/<id>/index.html` (copy an existing module's shell), add it to `MODULES` in `config.js`, add its path to `PRECACHE` in `sw.js`.

**After any change** — bump `VERSION` in `sw.js` so installed apps pick up the new files.

## Notes

- Licences and progress live in `localStorage` on each device. Keys deter casual sharing but are not DRM; the scheme is visible in `shared/js/storage.js`.
- Speech uses the device's Malay voice when one is installed, and falls back to the default voice.
- Local preview: `npx wrangler pages dev .` (emulates `_redirects` and `_headers`).
