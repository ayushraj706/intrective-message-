import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

// --- SABSE JARURI: Firebase Config (Ek bhi line miss mat karna) ---
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points", // <--- YE LINE MISSING THI!
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, platform, roomId, text, senderName } = req.body;
  
  console.log(`🧠 Neural Path: Processing for ${senderName}`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: DYNAMIC MODEL FINDER (v1beta rasta) ---
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const models = modelsRes.data.models || [];

    // Priority: Stable models first
    const bestModel = models.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                      models.find(m => m.name.includes("gemini-1.0-pro"))?.name ||
                      "models/gemini-1.5-flash";

    console.log(`✅ Brain Linked: ${bestModel}`);

    // --- STEP 2: GENERATE CONTENT ---
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${config.apiKey}`;
    const aiResponse = await axios.post(generateUrl, {
      contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
    });

    const aiReply = aiResponse.data.candidates[0].content.parts[0].text;

    // --- STEP 3: SEND REPLY ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    let endpoint = platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    console.log("🚀 Neural Loop Success!");
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Neural Crash:", errorMsg);
    
    // Alert the Sidebar Bell
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Firebase/AI Config Error",
      message: errorMsg,
      type: "error",
      status: "unread",
      platform: platform,
      timestamp: serverTimestamp()
    });

    return res.status(500).json({ error: errorMsg });
  }
}
