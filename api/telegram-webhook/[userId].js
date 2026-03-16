import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios"; // <--- Naya Import

const firebaseConfig = { /* ... aapka config ... */ };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId } = req.query;
  const body = req.body;

  try {
    if (body.message) {
      const chatId = body.message.chat.id.toString();
      const senderName = body.message.from.first_name || "TG User";
      const text = body.message.text || "📷 Media Message";
      const messageId = body.message.message_id.toString();

      // 1. Firebase mein save (Aapka purana logic)
      await addDoc(collection(db, "users", userId, "messages"), {
        text: text,
        sender: 'customer',
        senderNumber: chatId,
        senderName: senderName,
        wamid: messageId,
        platform: 'telegram',
        timestamp: serverTimestamp(),
        roomId: chatId,
        status: 'received'
      });

      // 2. AI TRIGGER: Telegram Bot ke liye
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const baseUrl = `${protocol}://${req.headers.host}`;

      axios.post(`${baseUrl}/api/ai-handler`, {
        userId: userId,
        platform: 'telegram',
        roomId: chatId,
        text: text,
        senderName: senderName
      }).catch(e => console.log("🤖 Telegram AI Trigger Failed:", e.message));
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("TG Webhook Error:", error);
    return res.status(500).json({ error: 'Server Error' });
  }
}
