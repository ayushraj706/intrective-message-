import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST allowed' });

  const { email, otp } = req.body;

  try {
    const doc = await db.collection('otps').doc(email).get();
    
    if (!doc.exists) return res.status(400).json({ success: false, error: 'OTP expired or not sent!' });

    const data = doc.data();

    if (data.otp === otp) {
      // --- LOGIC: Firebase Custom Token Generate Karo ---
      const customToken = await admin.auth().createCustomToken(email);

      await db.collection('users').doc(email).set({
        email,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await db.collection('otps').doc(email).delete();

      // Token frontend ko bhejo
      res.status(200).json({ success: true, token: customToken });
    } else {
      res.status(400).json({ success: false, error: 'Galat OTP!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
