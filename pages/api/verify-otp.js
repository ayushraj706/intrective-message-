import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sirf POST allow hai' });

  const { email, otp } = req.body;

  try {
    // 1. Firebase se OTP nikalo
    const doc = await db.collection('otps').doc(email).get();
    
    if (!doc.exists) {
      return res.status(400).json({ success: false, error: 'Pehle OTP bhejein!' });
    }

    const data = doc.data();
    
    // 2. OTP Match karo
    if (data.otp === otp) {
      // SUCCESS! Ab is email ko "users" wali list mein permanent save kar lo
      await db.collection('users').doc(email).set({
        email: email,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.status(200).json({ success: true, message: 'Login Mast Hua!' });
    } else {
      res.status(400).json({ success: false, error: 'Galat OTP bhai!' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
