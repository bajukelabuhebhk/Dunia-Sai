/*
 * The Pantau dashboard app is a second Cloudflare Pages project (pantau-dunia-sai) built from this repo.
 * Whether or not that project's root directory is set to /pantau-app, requests to its address are
 * answered from /pantau-app here, so it never shows the Dunia Sai site.
 * _routes.json limits this to the few paths the dashboard needs; the games never pass through here.
 */
const PANTAU_HOST = 'pantau-dunia-sai.pages.dev';

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const host = url.hostname;
  if ((host !== PANTAU_HOST && !host.endsWith('.' + PANTAU_HOST)) || url.pathname.startsWith('/api/')) return next();
  url.pathname = '/pantau-app' + url.pathname;
  return env.ASSETS.fetch(new Request(url, request));
}
