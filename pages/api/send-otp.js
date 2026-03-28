import { Resend } from 'resend';
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

const resend = new Resend(process.env.RESEND_API_KEY);

// Firebase Admin Init
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (err) { console.error("Firebase Init Error:", err.message); }
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // login.js se aane wala data: type ('login' or '2fa')
  const { email, type, targetPhone } = req.body; 
  const cleanEmail = email.trim().toLowerCase();
  
  // Prefix switching logic: verify-otp.js ke saath sync
  const docId = `${type === '2fa' ? '2fa' : 'login'}_${cleanEmail}`;

  try {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Save OTP to Firestore (login_email ya 2fa_email ke naam se)
    await db.collection('otps').doc(docId).set({
      otp: generatedOtp,
      expiresAt: Date.now() + 300000, // 5 min expiry
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Decide Delivery Method: Telegram for 2FA, Email for Primary
    if (type === '2fa' && targetPhone) {
      
      // --- TELEGRAM MASTER NODE ---
      const masterDoc = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      if (!masterDoc.exists) throw new Error("Master Node Config Missing");

      const { telegramSession, telegramApiId, telegramApiHash } = masterDoc.data();
      const client = new TelegramClient(
        new StringSession(telegramSession), 
        parseInt(telegramApiId), 
        telegramApiHash, 
        { connectionRetries: 5, useWSS: true }
      );

      await client.connect();

      // Vercel Fix: Button ko handler ke andar require karna
      const { Button } = require("telegram/tl/custom/button");
      
      // Phone cleaning logic: '++' hatane ke liye
      const cleanPhone = `+${targetPhone.replace(/\D/g, '')}`;

      if (Button && Button.inline) {
        await client.sendMessage(cleanPhone, {
          message: messageConfig.telegram(generatedOtp, cleanEmail),
          buttons: [[Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from(generatedOtp))]]
        });
      } else {
        // Fallback agar Button component fail ho jaye
        await client.sendMessage(cleanPhone, {
          message: `${messageConfig.telegram(generatedOtp, cleanEmail)}\n\nCode: ${generatedOtp}`
        });
      }

      await client.disconnect();
      return res.status(200).json({ success: true, mode: 'telegram' });

    } else {
      // --- PRIMARY EMAIL DELIVERY ---
      await resend.emails.send({
        from: 'BaseKey <admin@ayus.fun>',
        to: cleanEmail,
        subject: `Security Access Code: ${generatedOtp}`,
        html: messageConfig.emailHTML(generatedOtp)
      });

      return res.status(200).json({ success: true, mode: 'email' });
    }

  } catch (err) {
    console.error("Critical Send-OTP Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
