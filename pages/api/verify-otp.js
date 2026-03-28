import admin from 'firebase-admin';

// Firebase Admin initialization (Neural Safety Check)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error('Firebase Admin Init Error:', error.message);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email aur OTP dono zaroori hain!" });
  }

  // Prefix matching logic: Jo send-otp.js mein save hua tha
  const cleanEmail = email.trim().toLowerCase();
  const docId = `login_${cleanEmail}`;

  try {
    const otpDoc = await db.collection('otps').doc(docId).get();

    // 1. Check if OTP exists
    if (!otpDoc.exists) {
      return res.status(404).json({ success: false, error: "OTP expired ya generate nahi hua. Wapas try karein." });
    }

    const data = otpDoc.data();

    // 2. Verify OTP Match
    if (data.otp !== otp) {
      return res.status(400).json({ success: false, error: "Galat Security Code! Dubara check karein." });
    }

    // 3. Expiry Check (5 Minute Safety)
    if (Date.now() > data.expiresAt) {
      await db.collection('otps').doc(docId).delete();
      return res.status(400).json({ success: false, error: "Code Expire ho gaya hai. Naya request karein." });
    }

    // --- SUCCESS: LOGIN PROTOCOL ---
    
    // 4. Generate Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(cleanEmail);

    // 5. Update User Last Login (Audit Log)
    await db.collection('users').doc(cleanEmail).set({
      email: cleanEmail,
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 6. Delete OTP after successful use (Security First)
    await db.collection('otps').doc(docId).delete();

    // Return token to frontend
    return res.status(200).json({ 
      success: true, 
      token: customToken,
      message: "Neural Identity Verified!" 
    });

  } catch (err) {
    console.error("Verification Engine Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
