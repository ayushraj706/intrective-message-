import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userId } = req.query;
  const body = req.body;

  try {
    // Check if it's a valid Telegram message
    if (body.message) {
      const chatId = body.message.chat.id.toString(); // Telegram User ID
      const senderName = body.message.from.first_name || "TG User";
      const text = body.message.text || "📷 Media Message";
      const messageId = body.message.message_id.toString();

      console.log(`📩 New TG message from ${senderName}: ${text}`);

      // Save to Firebase (Note: platform field added)
      await addDoc(collection(db, "users", userId, "messages"), {
        text: text,
        sender: 'customer',
        senderNumber: chatId, // Telegram IDs number format mein hote hain
        senderName: senderName,
        wamid: messageId, // Tracker ID
        platform: 'telegram', // <-- Isse pata chalega ye WhatsApp nahi hai
        timestamp: serverTimestamp(),
        roomId: chatId,
        status: 'received'
      });
    }

    // Telegram requires a 200 OK response, otherwise it will keep retrying
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("TG Webhook Error:", error);
    return res.status(500).json({ error: 'Server Error' });
  }
}

