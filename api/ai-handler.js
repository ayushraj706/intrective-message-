import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import axios from "axios";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points", // FIX
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, platform, roomId, text, senderName } = req.body;
  
  console.log(`🧠 AI Brain Active for ${senderName} on ${platform}`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    
    const config = aiSnap.data();
    if (!config.platforms[platform]) return res.status(200).end();

    console.log("📡 Generating Neural Reply...");
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model === 'auto' ? 'gemini-1.5-flash' : config.model });
    
    const result = await model.generateContent(`${config.instructions}\n\nUser: ${text}\nReply:`);
    const aiReply = result.response.text();
    console.log("✨ Gemini Reply Generated!");

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = platform === 'telegram-api' ? "/api/send-telegram-client" : 
                   platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    console.log(`📤 Transmitting reply to ${endpoint}...`);
    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    console.log("🚀 Loop Complete!");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Path Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
