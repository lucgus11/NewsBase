// sw.js - Ajout de la gestion des notifications
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation');
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activé');
});

self.addEventListener('fetch', (e) => {
    // Laisse passer les requêtes normalement
});

// Écoute des notifications Push
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'NewsBase', body: 'Nouveaux articles disponibles !' };
    
    const options = {
        body: data.body,
        icon: '/Gemini_Generated_Image_adxl6eadxl6eadxl (1).png',
        badge: '/Gemini_Generated_Image_adxl6eadxl6eadxl (1).png',
        vibrate: [100, 50, 100],
        data: {
            url: '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
