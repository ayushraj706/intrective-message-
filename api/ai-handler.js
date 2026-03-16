import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
  
  console.log(`🧠 AI Path Triggered for ${senderName} (${platform})`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    
    const config = aiSnap.data();
    if (!config.platforms[platform]) return res.status(200).end();

    // SDK Setup (Removing v1beta force)
    const genAI = new GoogleGenerativeAI(config.apiKey);
    
    // Model selection logic
    let modelName = config.model === 'auto' ? 'gemini-1.5-flash' : config.model;
    
    // Check if user has Gemini 2.0 (as seen in your diagnostic screenshot)
    // If they want to use 2.0, they can select it from dashboard later.
    
    console.log(`📡 Requesting Gemini: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent(`${config.instructions}\n\nUser: ${text}\nReply:`);
    const aiReply = result.response.text();
    
    console.log("✨ Response Received from Gemini!");

    // --- REPLAY TRANSMISSION ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = "";
    if (platform === 'telegram-api') endpoint = "/api/send-telegram-client";
    else if (platform === 'whatsapp') endpoint = "/api/send-message";
    else if (platform === 'telegram') endpoint = "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    console.log(`🚀 Neural Link Complete! Message sent to ${platform}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Neural Path Error:", error.message);
    
    // Agar Gemini 1.5 Flash 404 de raha hai, toh 'gemini-pro' try karo as backup
    if (error.message.includes("404") || error.message.includes("not found")) {
        console.log("🔄 Retrying with fallback model...");
        // Yahan aap gemini-pro try kar sakte hain agar 1.5 flash fail ho
    }
    
    return res.status(500).json({ error: error.message });
  }
}
