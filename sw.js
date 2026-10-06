// غيّر رقم النسخة كل ما تعدّل في المنيو عشان الموبايلات تاخد التحديث
const VERSION = 'kranch-v1';
const CORE = [
  './', './index.html', './manifest.json', './117287.jpg', './117290.jpg'
];
 
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
 
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
 
  // الصفحة نفسها: الأحدث من النت لو فيه نت، وإلا من الكاش
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
 
  // باقي الحاجات (صور، خطوط، QR): من الكاش الأول، وبتتحدّث في الخلفية
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
 