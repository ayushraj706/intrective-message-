import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import translate from 'google-translate-api-x';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Firebase Configuration (Same as yours)
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

// Singleton pattern for Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // URL से userId निकालना (e.g., /api/webhook/user123)
  const { userId } = req.query;

  if (!userId) return res.status(400).send("User ID missing");

  // --- 1. FIRESTORE से यूजर की कॉन्फ़िगरेशन उठाना ---
  // हम मान रहे हैं कि 'configs' में आपने 'whatsapp' और 'ai_setup' डेटा रखा है
  const waConfigRef = doc(db, "configs", userId); // हर यूजर का अपना डॉक्युमेंट
  const aiConfigRef = doc(db, "configs", `${userId}_ai`); 
  
  const waSnap = await getDoc(waConfigRef);
  if (!waSnap.exists()) return res.status(404).send("User not configured");
  
  const waData = waSnap.data();
  const WHATSAPP_ACCESS_TOKEN = waData.accessToken;
  const VERIFY_TOKEN = waData.webhookVerifyToken || "basekey_default";

  // --- 2. WEBHOOK VERIFICATION (GET Request) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // --- 3. INCOMING MESSAGE (POST Request) ---
  if (req.method === 'POST') {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const incoming_phone_id = value.metadata.phone_number_id;

      // यूजर की AI सेटिंग चेक करना
      const aiSnap = await getDoc(aiConfigRef);
      const aiData = aiSnap.exists() ? aiSnap.data() : { aiType: 'none' };

      try {
        // --- मैसेज को यूजर के पर्सनल फोल्डर में सेव करना ---
        await addDoc(collection(db, "users", userId, "messages"), {
          text: msg.text?.body || "Media Message",
          sender: 'customer',
          senderNumber: from,
          timestamp: serverTimestamp(),
        });

        // --- AI LOGIC (अगर यूजर ने AI सेटअप किया है) ---
        if (aiData.aiType !== 'none' && aiData.config?.apiKey) {
          const genAI = new GoogleGenerativeAI(aiData.config.apiKey);
          const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          // AI Response logic... (आप वाला ही कोड यहाँ आएगा, बस API Key यूजर की होगी)
          const result = await aiModel.generateContent(msg.text?.body || "Hello");
          const aiResponse = result.response.text();

          // व्हाट्सएप पर जवाब भेजना
          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp",
            to: from,
            text: { body: aiResponse }
          }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });
        }
      } catch (err) {
        console.error("Multi-tenant Error:", err.message);
      }
    }
    return res.status(200).send('OK');
  }
}
