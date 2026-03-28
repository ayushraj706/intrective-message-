import { Resend } from 'resend';
import { TelegramClient, Api, Button } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages"; // Ensure this file exists

const resend = new Resend(process.env.RESEND_API_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email, type, targetPhone } = req.body; 
  if (!email) return res.status(400).json({ error: "Email missing" });

  const cleanEmail = email.trim().toLowerCase();
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const docId = `${type || 'login'}_${cleanEmail}`; // NEURAL PREFIX

  try {
    // 1. FIREBASE SAVE
    await db.collection('otps').doc(docId).set({
      email: cleanEmail,
      otp: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. EMAIL VIA RESEND
    try {
      await resend.emails.send({
        from: 'BaseKey Security <admin@ayus.fun>',
        to: cleanEmail,
        subject: `🛡️ Security Code: ${generatedOtp}`,
        html: messageConfig.emailHTML(generatedOtp)
      });
    } catch (e) { console.log("Email skip/fail"); }

    // 3. TELEGRAM VIA MASTER NODE
    // Note: Sirf tabhi bhejega jab targetPhone dashboard se aayega
    if (targetPhone) {
      const masterDoc = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      if (masterDoc.exists) {
        const { telegramSession, telegramApiId, telegramApiHash } = masterDoc.data();
        const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { connectionRetries: 5, useWSS: true });
        
        await client.connect();
        await client.sendMessage(`+${targetPhone.replace(/\D/g, '')}`, {
          message: messageConfig.telegram(generatedOtp, cleanEmail),
          buttons: [[Button.inline(`📋 Copy: ${generatedOtp}`, Buffer.from("copy"))]]
        });
        await client.disconnect();
      }
    }

    res.status(200).json({ success: true, message: "OTP Dispatched" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
