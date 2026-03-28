import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

// Firebase Admin Init
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
  const docId = `2fa_${cleanEmail}`;

  try {
    if (action === 'send') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      await db.collection('otps').doc(docId).set({
        otp: generatedOtp,
        expiresAt: Date.now() + 300000,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const masterDoc = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      const { telegramSession, telegramApiId, telegramApiHash } = masterDoc.data();

      const client = new TelegramClient(
        new StringSession(telegramSession), 
        parseInt(telegramApiId), 
        telegramApiHash, 
        { connectionRetries: 5, useWSS: true }
      );

      await client.connect();

      // --- NEURAL FIX: Dynamic Import for Button ---
      // Vercel bundle error se bachne ke liye hum ise yahan require kar rahe hain
      const { Button } = require("telegram/tl/custom/button");

      const formattedPhone = `+${targetPhone.replace(/\D/g, '')}`;

      // Agar Button phir bhi na mile, toh bina button ke message bhej do (Safety Fallback)
      if (Button && Button.inline) {
        await client.sendMessage(formattedPhone, {
          message: messageConfig.telegram(generatedOtp, cleanEmail),
          buttons: [[Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from(generatedOtp))]]
        });
      } else {
        // Fallback: Plain text message agar UI component fail ho jaye
        await client.sendMessage(formattedPhone, {
          message: `${messageConfig.telegram(generatedOtp, cleanEmail)}\n\n(Button failed to load, please copy manually)`
        });
      }

      await client.disconnect();
      return res.status(200).json({ success: true });
    }

    if (action === 'verify') {
      const otpDoc = await db.collection('otps').doc(docId).get();
      if (otpDoc.exists && otpDoc.data().otp === otp) {
        await db.collection('otps').doc(docId).delete();
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: "Invalid Code" });
    }

  } catch (error) {
    console.error("2FA Engine Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
