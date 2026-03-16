import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, platform, roomId, text, senderName } = req.body;
  
  console.log(`🧠 Neural Discovery Started for: ${senderName}`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: DYNAMIC MODEL DISCOVERY (Direct Fetch) ---
    console.log("🔍 Fetching active models from Google...");
    const modelsResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const models = modelsResponse.data.models || [];

    // Sabse pehle Flash 1.5 dhoondo, phir 2.0, phir Pro
    const selectedModel = models.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                          models.find(m => m.name.includes("gemini-2.0-flash"))?.name ||
                          models.find(m => m.name.includes("pro"))?.name ||
                          "models/gemini-1.5-flash"; // Ultimate Fallback

    console.log(`✅ Brain selected model: ${selectedModel}`);

    // --- STEP 2: GENERATE CONTENT (Direct REST API) ---
    // Hum SDK use nahi kar rahe taaki version ka error hi na aaye
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${config.apiKey}`;
    
    const aiResponse = await axios.post(generateUrl, {
      contents: [{
        parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }]
      }]
    });

    const aiReply = aiResponse.data.candidates[0].content.parts[0].text;
    console.log("✨ Neural Response Generated!");

    // --- STEP 3: SEND BACK ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = platform === 'telegram-api' ? "/api/send-telegram-client" : 
                   platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    console.log("🚀 Neural Loop Complete!");
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Path Crash:", errorMsg);
    
    // Bell Icon Notification
    try {
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "AI Neural Error",
        message: `Error in ${platform}: ${errorMsg}`,
        type: "error",
        status: "unread",
        platform: platform,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.log("Notif failed"); }

    return res.status(500).json({ error: errorMsg });
  }
}
