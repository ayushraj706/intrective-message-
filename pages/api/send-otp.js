import { Resend } from 'resend';
import admin from 'firebase-admin';

// Firebase Admin ko connect karna (Aapki JSON chabi se)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST allow hai' });
  }
  
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit ka code

  try {
    // 1. Firebase Firestore mein OTP save karna
    await db.collection('otps').doc(email).set({
      email: email,
      otp: otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Resend se email bhejna (AAPKE VERIFIED DOMAIN SE)
    const resendResponse = await resend.emails.send({
      from: 'Ayush App <admin@ayus.fun>', // ðŸ‘‡ Yahi wo line hai jisse 400 error theek hoga
      to: email,
      subject: `Ayus.fun Login OTP: ${otp}`,
      html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
               <h2 style="color: #2ea44f;">Ayus.fun par aapka swagat hai!</h2>
               <p style="font-size: 18px;">Aapka Login OTP hai:</p>
               <h1 style="background: #f4f4f4; padding: 10px; letter-spacing: 5px; color: #333;">${otp}</h1>
               <p style="color: #777; font-size: 12px;">Ise kisi ke saath share na karein.</p>
             </div>`,
    });

    // Agar Resend ne phir bhi koi error diya toh use pakdo
    if (resendResponse.error) {
      console.error("Resend Error:", resendResponse.error);
      return res.status(400).json({ success: false, error: resendResponse.error.message });
    }

    // Agar sab theek raha
    res.status(200).json({ success: true, message: "Email mast chala gaya!" });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
