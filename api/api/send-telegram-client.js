import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
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
    // 1. Fetch Session from Firebase
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { telegramApiId, telegramApiHash, telegramSession } = configSnap.data();

    if (!telegramSession) return res.status(400).json({ error: "Telegram Client API not configured." });

    // 2. Connect to Telegram
    const stringSession = new StringSession(telegramSession);
    const client = new TelegramClient(stringSession, parseInt(telegramApiId), telegramApiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    // 3. Send Message
    const tgRes = await client.sendMessage(to, { message: text });
    
    // 4. Save to Firebase 
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, 
      sender: 'admin', 
      senderNumber: to, // Telegram username or phone number
      wamid: tgRes.id.toString(),
      status: 'sent',
      platform: 'telegram-api', // Alag tag
      timestamp: serverTimestamp(),
    });

    // Client close karna zaroori hai Vercel me
    await client.disconnect();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram Client Send Error:", error);
    return res.status(500).json({ error: "Failed to send MTProto message" });
  }
}
