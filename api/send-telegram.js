import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, to, text } = req.body;

  if (!userId || !to || !text) return res.status(400).json({ error: "Data missing" });

  try {
    // 1. Fetch Token from Config
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { telegramBotToken } = configSnap.data();

    if (!telegramBotToken) return res.status(400).json({ error: "Telegram Bot Token not configured." });

    // 2. Send via Telegram API
    const tgRes = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      chat_id: to,
      text: text
    });

    const wamid = tgRes.data.result.message_id.toString();

    // 3. Save to Firebase (Platform tag zaroori hai)
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, 
      sender: 'admin', 
      senderNumber: to, 
      wamid: wamid,
      status: 'sent',
      platform: 'telegram', // Naye messages telegram tagged rahenge
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram Send Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send Telegram message" });
  }
}
