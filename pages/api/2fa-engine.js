import { TelegramClient, Api, Button } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages"; // Template file

// Firebase Admin Initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, targetPhone, otp } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const docId = `2fa_${cleanEmail}`; // NEURAL PREFIX

  try {
    // --- CASE 1: SEND OTP (Telegram Master Node) ---
    if (action === 'send') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save to Firebase
      await db.collection('otps').doc(docId).set({
        otp: generatedOtp,
        expiresAt: Date.now() + 300000, // 5 min expiry
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Master Node Se Telegram Bhejna
      const masterDoc = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      if (!masterDoc.exists) throw new Error("Master Config Not Found");

      const { telegramSession, telegramApiId, telegramApiHash } = masterDoc.data();
      const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { connectionRetries: 5, useWSS: true });
      
      await client.connect();
      const formattedPhone = `+${targetPhone.replace(/\D/g, '')}`;

      await client.sendMessage(formattedPhone, {
        message: messageConfig.telegram(generatedOtp, cleanEmail),
        buttons: [[Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from("copy"))]]
      });
      await client.disconnect();

      return res.status(200).json({ success: true, message: "2FA Signal Sent" });
    }

    // --- CASE 2: VERIFY OTP ---
    if (action === 'verify') {
      const otpDoc = await db.collection('otps').doc(docId).get();
      
      if (!otpDoc.exists) return res.status(404).json({ error: "Code expired ya generate nahi hua." });

      const data = otpDoc.data();
      if (data.otp !== otp) return res.status(400).json({ error: "Galat Security Code!" });
      if (Date.now() > data.expiresAt) return res.status(400).json({ error: "Code Expire ho gaya hai." });

      // Verification Success: Delete Code
      await db.collection('otps').doc(docId).delete();
      return res.status(200).json({ success: true, message: "Identity Verified" });
    }

  } catch (error) {
    console.error("2FA Engine Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

