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
  
  try {
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).end();
    const config = aiSnap.data();

    // --- STEP 1: DYNAMIC MODEL FINDER ---
    const modelsRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
    const models = modelsRes.data.models || [];

    // Priority: 1.5-flash (Stable) -> 1.5-pro -> 2.0-flash
    const bestModel = models.find(m => m.name.includes("gemini-1.5-flash"))?.name || 
                      models.find(m => m.name.includes("gemini-1.5-pro"))?.name ||
                      "models/gemini-1.5-flash";

    console.log(`✅ Brain linked to: ${bestModel}`);

    // --- STEP 2: GENERATE (With Smart Versioning) ---
    let aiReply = "";
    // 1.5 Models ke liye 'v1' zyada stable hai
    const apiVersion = bestModel.includes("2.0") ? "v1beta" : "v1";
    const generateUrl = `https://generativelanguage.googleapis.com/${apiVersion}/${bestModel}:generateContent?key=${config.apiKey}`;

    try {
        const aiResponse = await axios.post(generateUrl, {
          contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
        });
        aiReply = aiResponse.data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.log("🔄 Fallback to safe v1 legacy path...");
        // Ultimate Safe Path
        const safeUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${config.apiKey}`;
        const safeRes = await axios.post(safeUrl, {
            contents: [{ parts: [{ text: `${config.instructions}\n\nUser: ${text}\nReply:` }] }]
        });
        aiReply = safeRes.data.candidates[0].content.parts[0].text;
    }

    // --- STEP 3: SEND BACK ---
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;
    let endpoint = platform === 'telegram-api' ? "/api/send-telegram-client" : 
                   platform === 'whatsapp' ? "/api/send-message" : "/api/send-telegram";

    await axios.post(`${baseUrl}${endpoint}`, { userId, to: roomId, text: aiReply });
    return res.status(200).json({ success: true });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error("🔥 Final Crash:", errorMsg);
    // Notification for the bell
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Neural Error", message: errorMsg, type: "error", status: "unread", platform, timestamp: serverTimestamp()
    });
    return res.status(500).json({ error: errorMsg });
  }
}
