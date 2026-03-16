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
  
  console.log(`🧠 Neural Discovery: Searching for the most stable path...`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: GOOGLE SE MODELS KI LIST MANGWAO ---
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const allModels = modelsRes.data.models || [];

    // --- STEP 2: SABSE BASIC/PURANA MODEL DHOONDHO ---
    // Hum 2.0 ko ignore karenge kyunki wo quota kha jata hai.
    // Hum 'gemini-1.0-pro' dhoondhenge, jo sabse stable aur purana hai.
    const stableModel = allModels.find(m => m.name.includes("gemini-1.0-pro"))?.name || 
                        allModels.find(m => m.name.includes("gemini-1.5-pro"))?.name ||
                        allModels.find(m => m.name.includes("gemini-1.5-flash"))?.name ||
                        allModels[0]?.name; // Agar kuch na mile toh list ka pehla model

    console.log(`✅ Stable Brain Selected: ${stableModel}`);

    // --- STEP 3: REPLY GENERATE KARO ---
    // 'v1' endpoint use karenge purane models ke liye jo zyada stable hai
    const generateUrl = `https://generativelanguage.googleapis.com/v1/${stableModel}:generateContent?key=${config.apiKey}`;
    
    const aiResponse = await axios.post(generateUrl, {
      contents: [{
        parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }]
      }]
    });

    const aiReply = aiResponse.data.candidates[0].content.parts[0].text;
    console.log("✨ Response Received!");

    // --- STEP 4: SEND BACK ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    let endpoint = platform === 'telegram-api' ? "/api/send-telegram-client" : 
                   platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Neural Crash:", errorMsg);
    
    // Notification for Sidebar Bell
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Neural Quota Alert",
      message: errorMsg,
      type: "error",
      status: "unread",
      platform: platform,
      timestamp: serverTimestamp()
    });

    return res.status(500).json({ error: errorMsg });
  }
}
