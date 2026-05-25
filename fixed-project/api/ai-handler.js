import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

// --- PROJECT ID FIX: Har line hardcoded hai (Taaki Vercel error na de) ---
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points", 
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, platform, roomId, text, senderName } = req.body;
  
  console.log(`🧠 Neural Scan: Finding the most basic legacy model for ${senderName}...`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: GOOGLE SE PURI LIST MANGWAO ---
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const allModels = modelsRes.data.models || [];

    // --- STEP 2: "GHATIYA" MODEL SELECTION (Stability Priority) ---
    // Sabse pehle 'gemini-1.0-pro' dhoondhenge, ye sabse stable legacy model hai.
    // Agar wo na mile toh koi bhi 1.0 version, phir 1.5-flash.
    const selectedModel = allModels.find(m => m.name.includes("gemini-1.0-pro"))?.name || 
                          allModels.find(m => m.name.includes("gemini-1.0"))?.name ||
                          allModels.find(m => m.name.includes("gemini-1.5-flash"))?.name ||
                          allModels.filter(m => m.supportedGenerationMethods.includes("generateContent"))[0]?.name;

    console.log(`✅ Most Basic Model Selected: ${selectedModel}`);

    // --- STEP 3: FAIL-SAFE GENERATION (Try v1 first, then v1beta) ---
    let aiReply = "";
    const tryGenerate = async (version) => {
      const url = `https://generativelanguage.googleapis.com/${version}/${selectedModel}:generateContent?key=${config.apiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
      });
      return response.data.candidates[0].content.parts[0].text;
    };

    try {
      // Legacy models v1 par zyada stable chalte hain
      console.log(`📡 Attempting via v1 (${selectedModel})...`);
      aiReply = await tryGenerate('v1');
    } catch (e) {
      console.log("🔄 v1 failed/not-supported, falling back to v1beta...");
      aiReply = await tryGenerate('v1beta');
    }

    // --- STEP 4: ROUTING (WhatsApp / Telegram Bot / Telegram API) ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = "";
    if (platform === 'whatsapp') endpoint = "/api/send-message";
    else if (platform === 'telegram') endpoint = "/api/send-telegram"; 
    else if (platform === 'telegram-api') endpoint = "/api/send-telegram-client";

    console.log(`📤 Sending reply to ${platform} via ${endpoint}`);
    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Neural Path Crash:", errorMsg);
    
    // Notification for Sidebar Bell (Hindi Error Mapping)
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "AI Neural Error",
      message: errorMsg,
      type: "error",
      status: "unread",
      platform: platform,
      timestamp: serverTimestamp()
    });

    return res.status(500).json({ error: errorMsg });
  }
}
