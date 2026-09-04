// 그린나래 좌석 — 서비스워커 (PWA 설치/오프라인 셸 + 웹푸시 수신)
const CACHE = 'gn-v1';
const SHELL = ['./', 'app.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// HTML=네트워크 우선(항상 최신, 오프라인이면 캐시), 정적자원=캐시 우선. Supabase/CDN 은 손대지 않음.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // Supabase API·cdnjs 는 브라우저 기본 처리
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)).catch(() => {}); return res; })
        .catch(() => caches.match(req).then(h => h || caches.match('app.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)).catch(() => {}); return res;
    }))
  );
});

// ── 웹푸시(Phase 2) ──
self.addEventListener('push', e => {
  let d = { title: '그린나래 좌석', body: '' };
  try { d = Object.assign(d, e.data.json()); }
  catch (_) { if (e.data) d.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: 'icon-192.png', badge: 'badge.png', lang: 'ko',
    requireInteraction: true, vibrate: [300, 120, 300]   // 상단바=단색 실루엣(badge), 본문=컬러 로고(icon)
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('app.html');
  }));
});
