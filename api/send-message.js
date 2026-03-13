import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- FIREBASE CONFIG (Consistently using your project details) ---
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // सिर्फ POST रिक्वेस्ट की अनुमति है
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { userId, to, text } = req.body;

  // 1. डेटा की जांच (Validation)
  if (!userId || !to || !text) {
    return res.status(400).json({ error: "Missing required fields: userId, to, or text" });
  }

  try {
    // 2. Firestore से यूजर की WhatsApp सेटिंग्स निकालना
    const configSnap = await getDoc(doc(db, "configs", userId));
    
    if (!configSnap.exists()) {
      console.error(`Config not found for UID: ${userId}`);
      return res.status(404).json({ error: "WhatsApp configuration not found for this user." });
    }

    const { accessToken, phoneId } = configSnap.data();

    if (!accessToken || !phoneId) {
      return res.status(400).json({ error: "AccessToken or PhoneID missing in Firestore config." });
    }

    // 3. Meta (WhatsApp) API को मैसेज भेजना
    const metaResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
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

    // 4. मैसेज को डेटाबेस (History) में सेव करना
    // हम इसे 'users/[userId]/messages' के पाथ पर सेव कर रहे हैं
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text,
      sender: 'admin', 
      senderNumber: to, // कस्टमर का नंबर
      timestamp: serverTimestamp(),
    });

    // सफलता का जवाब
    return res.status(200).json({ 
      success: true, 
      messageId: metaResponse.data.messages[0].id 
    });

  } catch (error) {
    // अगर कुछ गड़बड़ हुई, तो यहाँ पकड़ी जाएगी
    const errorData = error.response?.data || error.message;
    console.error("CRITICAL ERROR in send-message.js:", JSON.stringify(errorData, null, 2));
    
    return res.status(500).json({ 
      error: "Failed to send WhatsApp message", 
      details: errorData 
    });
  }
}
