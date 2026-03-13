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

  const { userId, to, mediaUrl, mediaType } = req.body;

  if (!userId || !to || !mediaUrl) {
    return res.status(400).json({ error: "Missing media data" });
  }

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "Config missing" });

    const { accessToken, phoneId } = configSnap.data();

    // मेटा को लिंक भेजना (Image ya Document के हिसाब से)
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: mediaType,
        [mediaType]: { link: mediaUrl }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // चैट हिस्ट्री में फोटो का लिंक सेव करना
    await addDoc(collection(db, "users", userId, "messages"), {
      text: mediaType === 'image' ? "📷 Photo" : "📄 File",
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      sender: 'admin',
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Meta Media Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Meta rejected the media link" });
  }
}
