import axios from 'axios';
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1",
  measurementId: "G-64DR1TSTKY"
};

// --- मजबूत इनिशियलाइज़ेशन ---
async function getFirebaseApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps[0];
    if (!app.options.projectId) {
      await deleteApp(app);
      return initializeApp(firebaseConfig);
    }
    return app;
  }
  return initializeApp(firebaseConfig);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, to, text } = req.body;
  if (!userId || !to || !text) return res.status(400).json({ error: "Data missing" });

  try {
    const app = await getFirebaseApp();
    const db = getFirestore(app);

    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "Config missing" });
    
    const { accessToken, phoneId } = configSnap.data();

    // 1. Meta API Call (Purana Logic Safe Hai)
    const metaResponse = await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ''), 
      type: "text",
      text: { body: text }
    }, { headers: { Authorization: `Bearer ${accessToken}` } });

    // 2. Meta se WAMID nikalna (For Ticks)
    const wamid = metaResponse.data.messages[0].id;

    // 3. History Save (With WAMID & Status)
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, 
      sender: 'admin', 
      senderNumber: to, 
      wamid: wamid,       // Webhook isko dhoondhega
      status: 'sent',     // Single tick yahan se aayega
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true, wamid });
  } catch (error) {
    console.error("DEBUG ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
