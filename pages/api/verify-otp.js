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
    // 1. Firebase se OTP wala document nikalo
    const doc = await db.collection('otps').doc(email).get();
    
    if (!doc.exists) {
      return res.status(400).json({ success: false, error: 'Pehle OTP bhejein!' });
    }

    const data = doc.data();

    // 2. Expiry Check (Check karo ki 5 min se zyada toh nahi ho gaye)
    const currentTime = Date.now();
    if (data.expiresAt && currentTime > data.expiresAt) {
      return res.status(400).json({ success: false, error: 'OTP expire ho gaya hai, naya mangwayein!' });
    }
    
    // 3. OTP Match karo
    if (data.otp === otp) {
      // SUCCESS! User ko update karo
      await db.collection('users').doc(email).set({
        email: email,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // OTP use ho gaya, toh ise delete kar dena security ke liye achha hai
      await db.collection('otps').doc(email).delete();

      // Frontend ko signal bhejo
      res.status(200).json({ success: true, message: 'Login Mast Hua!' });
    } else {
      res.status(400).json({ success: false, error: 'Galat OTP bhai!' });
    }
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
