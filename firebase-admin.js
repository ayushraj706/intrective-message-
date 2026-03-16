import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
    console.log("🚀 Firebase Admin Initialized");
  } catch (error) {
    console.error("🔥 Firebase Admin Init Error:", error);
  }
}

const db = admin.firestore();
export { db };
