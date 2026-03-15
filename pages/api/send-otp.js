import { Resend } from 'resend';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute mein expire ho jayega

  try {
    // Firestore mein OTP aur Expiry save karein
    await db.collection('otps').doc(email).set({
      email,
      otp,
      expiresAt, // Ye check karne ke liye kaam aayega ki OTP purana to nahi
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Email bhejna
    const { data, error } = await resend.emails.send({
      from: 'BaseKey Admin <admin@ayus.fun>', 
      to: email,
      subject: `Verification Code: ${otp}`,
      html: `
        <div style="background: #000; color: #fff; padding: 40px; font-family: sans-serif; border-radius: 20px; text-align: center; border: 1px solid #333;">
          <h1 style="color: #3b82f6; font-style: italic;">BaseKey AI</h1>
          <p style="color: #888;">Aapka security verification code niche diya gaya hai:</p>
          <div style="background: #111; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px dashed #444;">
            <span style="font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #fff;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #555;">Ye code 5 minute mein expire ho jayega.</p>
        </div>
      `,
    });

    if (error) return res.status(400).json({ success: false, error: error.message });

    res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
