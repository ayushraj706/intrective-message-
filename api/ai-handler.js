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
    const availableModels = modelsResponse.data.models || [];

    // Sirf wahi models uthao jo content generate kar sakte hain
    const validModels = availableModels.filter(m => m.supportedGenerationMethods.includes("generateContent"));

    // PRIORITY LOGIC: gemini-1.5-flash ko sabse pehle rakhenge kyunki iska quota zyada stable hai
    // gemini-2.0-flash hamesha naye keys par '0 limit' deta hai
    const selectedModel = validModels.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                          validModels.find(m => m.name.includes("gemini-1.5-pro"))?.name ||
                          validModels.find(m => m.name.includes("gemini-2.0-flash"))?.name ||
                          validModels[0]?.name || "models/gemini-1.5-flash";

    console.log(`✅ Brain selected stable model: ${selectedModel}`);

    // --- STEP 2: GENERATE CONTENT WITH FALLBACK ---
    let aiReply = "";
    try {
        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${config.apiKey}`;
        const aiResponse = await axios.post(generateUrl, {
          contents: [{
            parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }]
          }]
        });
        aiReply = aiResponse.data.candidates[0].content.parts[0].text;
        console.log("✨ Neural Response Generated!");
    } catch (genError) {
        // Agar Quota Limit (429) ya koi Model Error aaye, toh turant backup model try karo
        console.log("🔄 Model failed or Quota full. Trying fallback (1.5-flash)...");
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.apiKey}`;
        const fallbackRes = await axios.post(fallbackUrl, {
            contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
        });
        aiReply = fallbackRes.data.candidates[0].content.parts[0].text;
        console.log("✨ Fallback Response Success!");
    }

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
    
    // Notification for the dashboard bell icon
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
