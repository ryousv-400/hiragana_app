// Service Worker - オフラインキャッシュ戦略
const CACHE_NAME = 'kakikata-v1';

// キャッシュするファイルリスト（アプリの全リソース）
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './data.js',
    './sounds.js',
    './style.css',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/apple-touch-icon.png'
];

// 外部CDNリソース（別途キャッシュ）
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700&display=swap',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

/**
 * install イベント - 全リソースをキャッシュに格納
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // ローカルアセットをキャッシュ
            const localCaching = cache.addAll(ASSETS_TO_CACHE);

            // 外部リソースは失敗してもインストールをブロックしない
            const externalCaching = Promise.allSettled(
                EXTERNAL_ASSETS.map((url) =>
                    fetch(url, { mode: 'cors' })
                        .then((response) => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        })
                        .catch(() => {
                            console.log('外部リソースのキャッシュをスキップ:', url);
                        })
                )
            );

            return Promise.all([localCaching, externalCaching]);
        }).then(() => {
            // 待機中のSWをすぐにアクティブにする
            return self.skipWaiting();
        })
    );
});

/**
 * activate イベント - 古いキャッシュを削除
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // すぐにページを制御下に置く
            return self.clients.claim();
        })
    );
});

/**
 * fetch イベント - Cache First 戦略
 * キャッシュにあればキャッシュから、なければネットワークから取得してキャッシュに追加
 */
self.addEventListener('fetch', (event) => {
    // POST リクエストなどはキャッシュしない
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // 正常なレスポンスのみキャッシュ
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // オフラインでキャッシュもない場合のフォールバック
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
