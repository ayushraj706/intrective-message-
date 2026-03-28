import { TelegramClient, Button } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }); }
const db = admin.firestore();

export default async function handler(req, res) {
  const { email, targetPhone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // Alag collection 'security_otps' use karenge
    await db.collection('security_otps').doc(email).set({ otp, expiresAt: Date.now() + 300000 });
    const master = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
    const { telegramSession, telegramApiId, telegramApiHash } = master.data();
    const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { connectionRetries: 5 });
    await client.connect();
    await client.sendMessage(`+${targetPhone.replace(/\D/g, '')}`, { message: messageConfig.telegram(otp, email), buttons: [[Button.inline(`📋 Copy: ${otp}`, Buffer.from("copy"))]] });
    await client.disconnect();
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

