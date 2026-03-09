// sw.js - Service Worker basique pour valider l'installation PWA
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation');
});

self.addEventListener('fetch', (e) => {
    // Laisse passer les requêtes normalement
});
