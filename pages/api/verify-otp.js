import admin from 'firebase-admin';

// Neural Safety: Firebase Admin initialization
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

  const { email, otp, type } = req.body; // type: 'login' (Email) ya '2fa' (Telegram)

  if (!email || !otp || !type) {
    return res.status(400).json({ success: false, error: "Missing Neural Credentials (Email/OTP/Type)" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const docId = `${type}_${cleanEmail}`; // Dynamically picking 'login_' or '2fa_'

  try {
    const otpDoc = await db.collection('otps').doc(docId).get();

    // 1. Existence Check
    if (!otpDoc.exists) {
      return res.status(404).json({ success: false, error: "OTP expired ya generate nahi hua." });
    }

    const data = otpDoc.data();

    // 2. Security Sequence Match
    if (data.otp !== otp) {
      return res.status(400).json({ success: false, error: "Galat Security Code! Identity mismatch." });
    }

    // 3. TTL (Time-To-Live) Check
    if (Date.now() > data.expiresAt) {
      await db.collection('otps').doc(docId).delete();
      return res.status(400).json({ success: false, error: "Code Expire ho gaya hai." });
    }

    // --- NEURAL 2FA CHECK LOGIC ---
    
    // Agar ye 'login' (Primary Email) verification hai
    if (type === 'login') {
      const userDoc = await db.collection('users').doc(cleanEmail).get();
      const userData = userDoc.data();

      // Check if user has enabled Telegram 2FA
      if (userData?.twoFactorEnabled && userData?.phoneNumber) {
        // Step 1 Clear: Now trigger Step 2 (Telegram)
        await db.collection('otps').doc(docId).delete();
        
        return res.status(200).json({ 
          success: true, 
          require2FA: true, 
          phoneNumber: userData.phoneNumber,
          message: "Primary identity verified. Telegram Node required." 
        });
      }
    }

    // --- FINAL AUTHENTICATION PROTOCOL ---
    // Agar 2FA verify ho gaya ya user ka 2FA off tha, toh login token do

    // 4. Generate VIP Pass (Custom Token)
    const customToken = await admin.auth().createCustomToken(cleanEmail);

    // 5. Update Audit Log
    await db.collection('users').doc(cleanEmail).set({
      email: cleanEmail,
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 6. Final Clean-up
    await db.collection('otps').doc(docId).delete();

    return res.status(200).json({ 
      success: true, 
      token: customToken,
      message: "Authentication Complete. Redirecting to Dashboard..." 
    });

  } catch (err) {
    console.error("Critical Engine Breach:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
