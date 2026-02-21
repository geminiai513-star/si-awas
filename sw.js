const CACHE_NAME = 'si-awas-v21';
const RUNTIME_CACHE = 'si-awas-runtime-cache';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon/icon.png',
    './icon/icon-512.png',
    './icon/pdf-file-icon.svg',
    './icon/docx-file-icon.svg',
    './icon/excel-file-icon.svg',
    './icon/ppt-file-icon.svg',
    './icon/javascript-file-icon.svg',
    './icon/css-file-icon.svg',
    './icon/java-file-icon.svg',
    './icon/html-file-icon.svg',
    './icon/xml-file-icon.svg',
    './icon/python-file-icon.svg',
    './icon/sql-file-icon.svg',
    './icon/typescript-file-icon.svg',
    './icon/lua-file-icon.svg',
    './icon/cpp-file-icon.svg',
    './icon/swift-file-icon.svg',
    './icon/image-file-icon.svg',
    './icon/default-file-icon.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&display=swap',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
    'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                ASSETS_TO_CACHE.map((url) => {
                    return fetch(url).then((res) => {
                        if (!res.ok) throw Error('Gagal memuat: ' + url);
                        return cache.put(url, res);
                    }).catch((err) => { });
                })
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. STRATEGI NETWORK-FIRST UNTUK API SUPABASE (CHAT HISTORY)
    // Hanya untuk GET request ke endpoint REST Supabase
    if (url.href.includes('supabase.co/rest/v1/') && event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Jika sukses mengambil data terbaru, simpan ke cache
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Jika offline/gagal fetch, ambil dari cache
                    return caches.match(event.request).then(cachedResponse => {
                        if (cachedResponse) return cachedResponse;
                        throw new Error('No cache available');
                    });
                })
        );
        return;
    }

    // 2. STRATEGI CACHE-FIRST UNTUK STATIC ASSETS
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});




