import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, to, text } = req.body;

  // Check if data is missing
  if (!userId || !to || !text) {
    console.error("Missing fields:", { userId, to, text });
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Get User Config from Firestore
    const configRef = doc(db, "configs", userId);
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      console.error(`Config not found for userId: ${userId}`);
      return res.status(404).json({ error: "User configuration not found in Firestore" });
    }

    const { accessToken, phoneId } = configSnap.data();

    // 2. Call Meta API
    console.log(`Sending message to ${to} using PhoneID ${phoneId}...`);
    
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

    // 3. Save to History
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text,
      sender: 'admin', 
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    console.log("Message sent successfully!");
    return res.status(200).json({ success: true });

  } catch (error) {
    // Ye line 500 error ko pakad legi aur detail batayegi
    const errorDetail = error.response?.data || error.message;
    console.error("CRITICAL ERROR in send-message:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: errorDetail 
    });
  }
}
