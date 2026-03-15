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

// --- à¤®à¤œà¤¬à¥‚à¤¤ à¤‡à¤¨à¤¿à¤¶à¤¿à¤¯à¤²à¤¾à¤‡à¥›à¥‡à¤¶à¤¨ ---
async function getFirebaseApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps[0];
    // à¤…à¤—à¤° à¤ªà¥à¤°à¤¾à¤¨à¥‡ à¤à¤ª à¤®à¥‡à¤‚ projectId à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ, à¤¤à¥‹ à¤‰à¤¸à¥‡ à¤¹à¤Ÿà¤¾à¤“
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

    // Meta API Call
    await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ''), 
      type: "text",
      text: { body: text }
    }, { headers: { Authorization: `Bearer ${accessToken}` } });

    // History Save
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text, sender: 'admin', senderNumber: to, timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DEBUG ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
