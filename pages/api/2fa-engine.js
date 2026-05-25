import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

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
  const docId = `2fa_${cleanEmail}`;

  try {
    // --- ACTION: SEND (Requesting 2FA Code) ---
    if (action === 'send') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Phone number ko bhi save karein taaki verify ke waqt link ho sake
      await db.collection('otps').doc(docId).set({
        otp: generatedOtp,
        expiresAt: Date.now() + 300000,
        targetPhone: targetPhone, // Neutral Link: Saving phone for later
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
      const { Button } = require("telegram/tl/custom/button");
      const formattedPhone = `+${targetPhone.replace(/\D/g, '')}`;

      if (Button && Button.inline) {
        await client.sendMessage(formattedPhone, {
          message: messageConfig.telegram(generatedOtp, cleanEmail),
          buttons: [[Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from(generatedOtp))]]
        });
      } else {
        await client.sendMessage(formattedPhone, {
          message: `${messageConfig.telegram(generatedOtp, cleanEmail)}\n\n(Code: ${generatedOtp})`
        });
      }

      await client.disconnect();
      return res.status(200).json({ success: true });
    }

    // --- ACTION: VERIFY (Activating 2FA Permanently) ---
    if (action === 'verify') {
      const otpDoc = await db.collection('otps').doc(docId).get();
      
      if (!otpDoc.exists) return res.status(404).json({ error: "Code expired ya invalid." });

      const data = otpDoc.data();
      if (data.otp !== otp) return res.status(400).json({ error: "Incorrect Security Code." });
      if (Date.now() > data.expiresAt) return res.status(400).json({ error: "Code Expired." });

      // --- NEURAL FIX: DATABASE UPDATE ---
      // Ab ye status hamesha ke liye Firestore mein save hoga
      await db.collection('users').doc(cleanEmail).set({
        twoFactorEnabled: true,
        phoneNumber: data.targetPhone, // Phone number linked permanently
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Clean up OTP document
      await db.collection('otps').doc(docId).delete();

      return res.status(200).json({ 
        success: true, 
        message: "2FA Protocol Activated Permanently." 
      });
    }

  } catch (error) {
    console.error("2FA Engine Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
