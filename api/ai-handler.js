import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

// --- SABSE JARURI: HARDCODED CONFIG (Fix for ProjectId error) ---
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points", // <--- Ye line Vercel ko chahiye hi chahiye
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

// Global Firebase Instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { userId, platform, roomId, text, senderName } = req.body;
  console.log(`🧠 Neural Path Start: ${senderName} on ${platform}`);

  try {
    // 1. Config uthao
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') {
        return res.status(200).json({ msg: "AI Inactive" });
    }
    const config = aiSnap.data();

    // 2. MODEL DISCOVERY (Finding the most stable rasta)
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const allModels = modelsRes.data.models || [];

    // Priority Selection (Stable -> Basic -> Fallback)
    const selectedModel = allModels.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                          allModels.find(m => m.name.includes("gemini-1.0-pro"))?.name ||
                          "models/gemini-1.5-flash";

    console.log(`✅ Using Model: ${selectedModel}`);

    // 3. GENERATE REPLY (Direct REST call)
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${config.apiKey}`;
    const aiResponse = await axios.post(generateUrl, {
      contents: [{
        parts: [{ text: `${config.instructions}\n\nUser: ${text}\nResponse:` }]
      }]
    });

    const aiReply = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "Neural loop timed out.";

    // 4. DYNAMIC ROUTING (WhatsApp + Telegram Bot + Telegram Client)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = "";
    if (platform === 'whatsapp') endpoint = "/api/send-message";
    else if (platform === 'telegram') endpoint = "/api/send-telegram"; // Bot Father wala
    else if (platform === 'telegram-api') endpoint = "/api/send-telegram-client"; // Client/Render wala

    console.log(`📤 Sending to ${platform} via ${endpoint}`);

    await axios.post(`${baseUrl}${endpoint}`, {
      userId: userId,
      to: roomId,
      text: aiReply
    });

    console.log("🚀 Loop Successful!");
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Neural Crash:", errorMsg);

    // Save to Sidebar Notifications (Bell Icon)
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: `Neural Error (${platform})`,
      message: errorMsg,
      type: "error",
      status: "unread",
      platform: platform,
      timestamp: serverTimestamp()
    });

    return res.status(500).json({ error: errorMsg });
  }
}
