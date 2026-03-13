import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- FIREBASE CONFIG (Dhyan se dekho, ab isme projectId hai) ---
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

// Initialize Firebase (Singleton to avoid multiple app error)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, to, text } = req.body;

  if (!userId || !to || !text) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. User ki keys Firestore se nikalna (Kyuki har user ka apna token hai)
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "User configuration not found" });

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
      { 
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // 3. Sent message ko Firestore mein save karna (Chat history ke liye)
    // Ye 'users/[userId]/messages' wale naye raste par jayega
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text,
      sender: 'admin', 
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true, messageId: metaRes.data.messages[0].id });

  } catch (error) {
    console.error("Meta Send Error Detail:", error.response?.data || error.message);
    return res.status(500).json({ 
      error: "Failed to send message", 
      details: error.response?.data || error.message 
    });
  }
}
