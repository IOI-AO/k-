 // غيّر VERSION لما تعدّل sw.js أو الأيقونات أو صورة 117287.jpg. المنيو نفسه (index.html) بيتحدّث لوحده من النت.
const VERSION = 'kranch-v9';
// صور الأصناف والخطوط: بتفضل متخزنة ومش بتتمسح لما VERSION يتغيّر.
// لو غيّرت صورة صنف بنفس الاسم، غيّر الرقم هنا (kranch-assets-v2) أو سمّيها باسم جديد.
const ASSETS = 'kranch-assets-v1';
const CORE = ['./', './index.html', './manifest.json', './117287.jpg', './117290.jpg'];
 
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
 
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== ASSETS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
 
function store(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(ASSETS).then(c => c.put(req, copy));
  }
  return res;
}
 
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
 
  // الصفحة نفسها: الأحدث من النت لو فيه نت، وإلا من الكاش (ومش بنخزّن صفحات الخطأ)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
 
  // الصور: من الكاش الأول، ولو مش موجودة تتحمّل مرة واحدة وتتخزن (من غير طلب تحديث في الخلفية)
  if (req.destination === 'image') {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => store(req, res)))
    );
    return;
  }
 
  // باقي الحاجات (خطوط...): من الكاش الأول، وبتتحدّث في الخلفية
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => store(req, res)).catch(() => cached);
      return cached || fresh;
    })
  );
});
 
