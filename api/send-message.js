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
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { userId, to, mediaUrl, mediaType } = req.body;

  // 1. Data Verification
  if (!userId || !to || !mediaUrl) {
    return res.status(400).json({ error: "Missing media data", received: { userId, to, mediaUrl } });
  }

  try {
    // 2. Firestore से Config लाना
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "Config not found" });
    
    const { accessToken, phoneId } = configSnap.data();

    // 3. Meta API Payload (व्हाट्सएप के लिए एकदम सही फॉर्मेट)
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: mediaType === 'image' ? 'image' : 'document',
      [mediaType === 'image' ? 'image' : 'document']: {
        link: mediaUrl,
        // Document के लिए कैप्शन या नाम ज़रूरी हो सकता है
        ...(mediaType === 'document' && { filename: "BaseKey_Document" })
      }
    };

    console.log("Sending Media to Meta...");

    // 4. Meta API को कॉल करना
    const metaRes = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      payload,
      { 
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // 5. Firestore History में सेव करना
    await addDoc(collection(db, "users", userId, "messages"), {
      text: mediaType === 'image' ? "📷 Photo Message" : "📄 Document Message",
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      sender: 'admin',
      senderNumber: to,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true, metaResponse: metaRes.data });

  } catch (error) {
    // असली एरर यहाँ दिखेगा
    const errorDetail = error.response?.data || error.message;
    console.error("META REJECTED MEDIA:", JSON.stringify(errorDetail, null, 2));
    
    return res.status(500).json({ 
      error: "Meta rejected the media request", 
      details: errorDetail 
    });
  }
}
