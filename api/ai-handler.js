import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import axios from "axios";

// --- FULL FIREBASE CONFIG (Wahi jo webhook mein hai) ---
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points", // YAHAN GALTI THI
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

  try {
    // 1. Firebase se Config uthao
    const aiRef = doc(db, "configs", userId, "ai", "gemini");
    const aiSnap = await getDoc(aiRef);

    if (!aiSnap.exists() || aiSnap.data().status !== 'active') {
      return res.status(200).json({ msg: "AI Inactive or Not Found" });
    }

    const config = aiSnap.data();

    // 2. Check Platform Enablement
    if (!config.platforms || !config.platforms[platform]) {
      return res.status(200).json({ msg: "Platform Disabled" });
    }

    console.log(`🤖 AI Thinking for ${senderName}...`);

    // 3. Gemini Setup
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const modelName = config.model === 'auto' ? 'gemini-1.5-flash' : config.model;
    const model = genAI.getGenerativeModel({ model: modelName });

    // 4. Prompt Engineering
    const finalPrompt = `${config.instructions}\n\nUser (${senderName}): ${text}\nResponse:`;
    
    const result = await model.generateContent(finalPrompt);
    const responseText = result.response.text();

    // 5. Trigger Sending API
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = "";
    if (platform === 'telegram-api') endpoint = "/api/send-telegram-client";
    else if (platform === 'telegram') endpoint = "/api/send-telegram";
    else if (platform === 'whatsapp') endpoint = "/api/send-message";

    await axios.post(`${baseUrl}${endpoint}`, {
      userId: userId,
      to: roomId,
      text: responseText
    });

    return res.status(200).json({ success: true, reply: responseText });

  } catch (error) {
    console.error("❌ AI Handler Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
