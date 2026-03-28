import { Resend } from 'resend';
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Button } from "telegram/tl/index.js"; 
import admin from 'firebase-admin';
import { messageConfig } from "../../lib/messages";

const resend = new Resend(process.env.RESEND_API_KEY);
if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }); }
const db = admin.firestore();

export default async function handler(req, res) {
  const { email, method, phoneNumber } = req.body; // method: 'email' ya 'telegram'
  let targetEmail = email;
  let targetPhone = phoneNumber;

  try {
    // --- TELEGRAM LOGIN LOGIC ---
    if (method === 'telegram') {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('phoneNumber', '==', phoneNumber.replace(/\D/g, '')).get();
      
      if (snapshot.empty) return res.status(404).json({ error: "Number linked nahi hai!" });
      
      targetEmail = snapshot.docs[0].id; // Linked Email mil gaya
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const docId = `login_${targetEmail.trim().toLowerCase()}`;

    // Save OTP to Firestore
    await db.collection('otps').doc(docId).set({
      otp: generatedOtp,
      expiresAt: Date.now() + 300000
    });

    if (method === 'telegram') {
      // MASTER NODE SE TELEGRAM BHEJO
      const master = await db.collection('configs').doc('ayushrajayushhh@gmail.com').get();
      const { telegramSession, telegramApiId, telegramApiHash } = master.data();
      const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { connectionRetries: 5 });
      await client.connect();
      await client.sendMessage(`+${targetPhone.replace(/\D/g, '')}`, {
        message: messageConfig.telegram(generatedOtp, targetEmail),
        buttons: [[Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from(generatedOtp))]]
      });
      await client.disconnect();
    } else {
      // EMAIL BHEJO
      await resend.emails.send({
        from: 'BaseKey <admin@ayus.fun>',
        to: targetEmail,
        subject: `Login Code: ${generatedOtp}`,
        html: messageConfig.emailHTML(generatedOtp)
      });
    }

    return res.status(200).json({ success: true, email: targetEmail });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
