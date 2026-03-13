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
  // 1. TURANT LOG KARNA (Taki pata chale request aayi hai)
  console.log("--- MEDIA REQUEST RECEIVED ---", req.body);

  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { userId, to, mediaUrl, mediaType } = req.body;

  if (!userId || !to || !mediaUrl) {
    console.error("Missing Data in Body:", { userId, to, mediaUrl });
    return res.status(400).json({ error: "Missing data fields" });
  }

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) throw new Error("Firebase Config Missing");
    
    const { accessToken, phoneId } = configSnap.data();

    // 2. Meta API Call (Simplified Payload)
    const metaRes = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: mediaType === 'image' ? 'image' : 'document',
        [mediaType === 'image' ? 'image' : 'document']: { link: mediaUrl }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("Meta Response Success:", metaRes.data);

    // 3. Save to Firestore
    await addDoc(collection(db, "users", userId, "messages"), {
      text: mediaType === 'image' ? "📷 Photo" : "📄 File",
      mediaUrl,
      mediaType,
      sender: 'admin',
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("FATAL MEDIA ERROR:", JSON.stringify(errorMsg, null, 2));
    return res.status(500).json({ error: "Failed to send media", details: errorMsg });
  }
}
