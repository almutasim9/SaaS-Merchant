importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// This file must exist at the root of the 'public' folder.
// Replace this config with the values you receive when creating the Firebase app
const firebaseConfig = {
    apiKey: "AIzaSyBphPEdpv5OG8MVuz2GnnfBgXdDNK1cWFM",
    projectId: "tajirzone-e09f5",
    messagingSenderId: "1029849508224",
    appId: "1:1029849508224:web:9b48ce61211ce988f0f965",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
    );

    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/icon512_maskable.png', // The app's PWA icon
        badge: '/icon512_rounded.png', // Small icon for the status bar
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicking on the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Determine the URL to open (either from the payload data or default to orders page)
    const urlToOpen = event.notification.data?.url || '/merchant/orders';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
