import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

// --- PROJECT ID FIX: Har line hardcoded hai ---
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
  
  console.log(`🧠 Neural Discovery: Finding the most legacy/stable model for ${senderName}`);

  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: GOOGLE SE SABHI MODELS KI LIST MANGWAO ---
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const allModels = modelsRes.data.models || [];

    // --- STEP 2: STABILITY PRIORITY (Ghatiya/Legacy First) ---
    // Hum gemini-1.0-pro dhoondhenge kyunki ye sabse purana aur stable hai, quota error nahi deta.
    const selectedModel = allModels.find(m => m.name.includes("gemini-1.0-pro"))?.name || 
                          allModels.find(m => m.name.includes("gemini-1.5-flash"))?.name ||
                          allModels.filter(m => m.supportedGenerationMethods.includes("generateContent"))[0]?.name ||
                          "models/gemini-1.5-flash";

    console.log(`✅ Stable Brain Selected: ${selectedModel}`);

    // --- STEP 3: GENERATE CONTENT (v1 use karenge stable response ke liye) ---
    // Agar model 1.0 ya 1.5 hai toh v1 endpoint sabse best hai
    const apiVersion = selectedModel.includes("2.0") ? "v1beta" : "v1";
    const generateUrl = `https://generativelanguage.googleapis.com/${apiVersion}/${selectedModel}:generateContent?key=${config.apiKey}`;
    
    const aiResponse = await axios.post(generateUrl, {
      contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
    });

    const aiReply = aiResponse.data.candidates[0].content.parts[0].text;

    // --- STEP 4: DYNAMIC ROUTING (WhatsApp / Telegram Bot / Telegram Client) ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    
    let endpoint = "";
    if (platform === 'whatsapp') endpoint = "/api/send-message";
    else if (platform === 'telegram') endpoint = "/api/send-telegram"; // Bot API
    else if (platform === 'telegram-api') endpoint = "/api/send-telegram-client"; // Client API

    console.log(`📤 Forwarding to ${platform} via ${endpoint}`);
    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Path Failure:", errorMsg);
    
    // Notification for the Sidebar Bell
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Neural Path Error",
      message: errorMsg,
      type: "error",
      status: "unread",
      platform: platform,
      timestamp: serverTimestamp()
    });

    return res.status(500).json({ error: errorMsg });
  }
}
