import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8", // <-- Ye check karo, yahi galti ho rahi hai
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, to, text } = req.body;
  if (!userId || !to || !text) return res.status(400).json({ error: "Data missing" });

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { accessToken, phoneId } = configSnap.data();

    await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ''), 
      type: "text",
      text: { body: text }
    }, { headers: { Authorization: `Bearer ${accessToken}` } });

    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, sender: 'admin', senderNumber: to, timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
