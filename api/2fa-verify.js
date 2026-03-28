import admin from 'firebase-admin';
if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }); }
const db = admin.firestore();

export default async function handler(req, res) {
  const { email, otp } = req.body;
  try {
    const doc = await db.collection('security_otps').doc(email).get();
    if (doc.exists && doc.data().otp === otp) {
      await db.collection('security_otps').doc(email).delete();
      res.status(200).json({ success: true });
    } else { res.status(400).json({ error: "Invalid 2FA Code" }); }
  } catch (err) { res.status(500).json({ error: err.message }); }
}

