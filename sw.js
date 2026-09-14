// 그린나래 좌석 — 서비스워커 (PWA 설치/오프라인 셸 + 웹푸시 수신)
const CACHE = 'gn-v3';
const SHELL = ['/app', '/manifest.webmanifest', '/icon.svg', '/icon-180.png', '/icon-192.png', '/icon-512.png', '/badge.png',
  '/vendor/qrcode.min.js', '/inapp.js', '/fonts/pretendard/pretendardvariable-dynamic-subset.css'];

// 리다이렉트·오류 응답은 캐시하지 않음(Safari 가 리다이렉트된 캐시 응답을 거부함)
const cacheable = res => res && res.ok && res.type === 'basic' && !res.redirected;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u =>
    fetch(u, { cache: 'reload' }).then(r => cacheable(r) ? c.put(u, r) : null).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// HTML=네트워크 우선(항상 최신, 오프라인이면 캐시) · JS/CSS=캐시 즉시 + 백그라운드 갱신 · 폰트/아이콘=캐시 우선.
// Supabase·외부 요청은 손대지 않음.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const put = res => { if (cacheable(res)) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)).catch(() => {}); } return res; };
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then(h => h || caches.match('/app'))));
    return;
  }
  if (/\.(js|css)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(put).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(put)));
});

// ── 웹푸시 ──
self.addEventListener('push', e => {
  let d = { title: '그린나래', body: '' };
  try { d = Object.assign(d, e.data.json()); }
  catch (_) { if (e.data) d.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: '/icon-192.png', badge: '/badge.png', lang: 'ko',
    requireInteraction: true, vibrate: [300, 120, 300]   // 상단바=단색 실루엣(badge), 본문=컬러 로고(icon)
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if (new URL(c.url).pathname.startsWith('/app') && 'focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/app');
  }));
});
