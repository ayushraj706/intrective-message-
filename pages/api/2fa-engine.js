import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
// Vercel/Next.js Fix: Button ko direct TL path se import karna padta hai
import { Button } from "telegram/tl/index.js"; 
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

// Firebase Admin Initialization
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (err) {
    console.error("Firebase Admin Error:", err.message);
  }
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, targetPhone, otp } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });
  
  const cleanEmail = email.trim().toLowerCase();
  const docId = `2fa_${cleanEmail}`;

  try {
    // --- CASE 1: SEND OTP ---
    if (action === 'send') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      await db.collection('otps').doc(docId).set({
        otp: generatedOtp,
        expiresAt: Date.now() + 300000, 
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const masterDoc = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      if (!masterDoc.exists) throw new Error("Master Config Missing in Firestore");

      const { telegramSession, telegramApiId, telegramApiHash } = masterDoc.data();
      
      const client = new TelegramClient(
        new StringSession(telegramSession), 
        parseInt(telegramApiId), 
        telegramApiHash, 
        { connectionRetries: 5, useWSS: true }
      );
      
      await client.connect();
      
      const formattedPhone = `+${targetPhone.replace(/\D/g, '')}`;

      // Logic Check: Button check before sending
      if (!Button || !Button.inline) {
        throw new Error("Telegram UI components (Button) failed to load.");
      }

      await client.sendMessage(formattedPhone, {
        message: messageConfig.telegram(generatedOtp, cleanEmail),
        buttons: [
          [Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from(generatedOtp))]
        ]
      });
      
      await client.disconnect();
      return res.status(200).json({ success: true, message: "2FA Sent" });
    }

    // --- CASE 2: VERIFY OTP ---
    if (action === 'verify') {
      const otpDoc = await db.collection('otps').doc(docId).get();
      
      if (!otpDoc.exists) return res.status(404).json({ error: "Code expired ya invalid." });

      const data = otpDoc.data();
      if (data.otp !== otp) return res.status(400).json({ error: "Galat Security Code!" });
      if (Date.now() > data.expiresAt) {
        await db.collection('otps').doc(docId).delete();
        return res.status(400).json({ error: "Code Expired!" });
      }

      await db.collection('otps').doc(docId).delete();
      return res.status(200).json({ success: true, message: "Identity Verified" });
    }

  } catch (error) {
    console.error("2FA Engine Critical Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
