// 그린나래 좌석 — 서비스워커 (웹푸시, Phase 2)
// 푸시 발송은 Supabase Edge Function(VAPID 서명)에서. 여기선 수신·표시만 담당.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = { title: '그린나래 좌석', body: '' };
  try { d = Object.assign(d, e.data.json()); }
  catch (_) { if (e.data) d.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: 'icon.svg', badge: 'icon.svg', lang: 'ko'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('app.html');
  }));
});
