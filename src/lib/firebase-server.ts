import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally to avoid re-initialization in dev mode
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines so the private key works correctly
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase admin initialized.');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminMessaging = admin.messaging();
