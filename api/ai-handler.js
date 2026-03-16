import { GoogleGenerativeAI } from "@google/generative-ai";
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
  
  console.log(`🧠 AI Neural Path: Starting for ${senderName}`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    const genAI = new GoogleGenerativeAI(config.apiKey);

    // --- STEP 1: DYNAMIC MODEL FINDER ---
    console.log("🔍 Finding available models...");
    let finalModelName = "";
    
    try {
      // Google se models ki list mangwao
      const modelList = await genAI.listModels();
      const availableModels = modelList.models || [];
      
      // List mein se sahi model chunne ka logic:
      // Priority: 1.5-flash -> 2.0-flash -> gemini-pro
      const bestModel = availableModels.find(m => m.name.includes("1.5-flash") && m.supportedGenerationMethods.includes("generateContent")) ||
                        availableModels.find(m => m.name.includes("2.0-flash")) ||
                        availableModels.find(m => m.name.includes("pro"));

      if (bestModel) {
        finalModelName = bestModel.name; // Ye hamesha "models/..." format mein hoga
        console.log(`✅ Brain selected: ${finalModelName}`);
      } else {
        throw new Error("No compatible models found in your API key.");
      }
    } catch (listError) {
      console.error("❌ Model List Error:", listError.message);
      // Fallback agar list fail ho jaye
      finalModelName = "models/gemini-1.5-flash-latest"; 
    }

    // --- STEP 2: GENERATE CONTENT ---
    const model = genAI.getGenerativeModel({ model: finalModelName });
    const result = await model.generateContent(`${config.instructions}\n\nUser: ${text}\nReply:`);
    const aiReply = result.response.text();
    console.log("✨ Neural response generated!");

    // --- STEP 3: SEND BACK ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = platform === 'telegram-api' ? "/api/send-telegram-client" : 
                   platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    console.log("🚀 Neural Loop Complete!");
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("🔥 Neural Crash:", error.message);
    
    // Naya Notification Logic (Bell Icon ke liye)
    try {
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "AI Integration Error",
        message: `Error in ${platform}: ${error.message}`,
        type: "error",
        status: "unread",
        platform: platform,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.log("Notification failed"); }

    return res.status(500).json({ error: error.message });
  }
}
