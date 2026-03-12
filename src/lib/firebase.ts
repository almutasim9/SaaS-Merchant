import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// These values will come from the Firebase Console when you create a web app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async () => {
  try {
    const isReady = await isSupported();
    if (!isReady) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return null;
    }

    const messaging = getMessaging(app);
    // Request permission from the user
    // The VAPID key is optional for basic setup but Highly Recommended to prevent abuse
    const currentToken = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
    });

    if (currentToken) {
      console.log('FCM Token generated successfully');
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });

export default app;
