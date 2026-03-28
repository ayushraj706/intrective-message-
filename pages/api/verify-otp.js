import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST allowed' });

  const { email, otp, type } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const docId = `${type || 'login'}_${cleanEmail}`; // Match prefix

  try {
    const otpDoc = await db.collection('otps').doc(docId).get();
    
    if (!otpDoc.exists) return res.status(400).json({ error: 'OTP expired ya generate nahi hua!' });

    const data = otpDoc.data();

    // 1. Basic Validation
    if (data.otp !== otp) return res.status(400).json({ error: 'Galat OTP!' });
    if (Date.now() > data.expiresAt) return res.status(400).json({ error: 'OTP Expire ho gaya hai.' });

    // 2. SUCCESS LOGIC
    let responseData = { success: true };

    if (type === 'login') {
      // Login ke liye Custom Token banayein
      const customToken = await admin.auth().createCustomToken(cleanEmail);
      responseData.token = customToken;

      await db.collection('users').doc(cleanEmail).set({
        email: cleanEmail,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Clear OTP after success
    await db.collection('otps').doc(docId).delete();

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
