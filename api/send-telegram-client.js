// pages/api/send-telegram-client.js
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

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { telegramApiId, telegramApiHash, telegramSession } = configSnap.data();

    const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { connectionRetries: 5 });
    await client.connect();

    // --- OUTGOING FIX ---
    // Agar 'to' field mein '+' nahi hai, matlab wo ID hai. GramJS ko BigInt chahiye.
    let peer = to;
    if (!to.startsWith('+')) {
        peer = BigInt(to); 
    }

    const tgRes = await client.sendMessage(peer, { message: text });
    
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, 
      sender: 'admin', 
      senderNumber: to, 
      wamid: tgRes.id.toString(),
      status: 'sent',
      platform: 'telegram-api',
      timestamp: serverTimestamp(),
    });

    await client.disconnect();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Send Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
