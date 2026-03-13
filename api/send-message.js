import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = { /* Tumhari Firebase Config */ };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, to, text } = req.body;

  try {
    // 1. User ki keys Firestore se nikalna
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "Config not found" });

    const { accessToken, phoneId } = configSnap.data();

    // 2. Meta API ko message bhejna
    const metaRes = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 3. Sent message ko Firestore mein save karna (Chat history ke liye)
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text,
      sender: 'admin', // Taaki pata chale ye tumne bheja hai
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Send Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
