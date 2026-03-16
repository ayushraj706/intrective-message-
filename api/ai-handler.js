import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import axios from "axios";

// Firebase Config (Same as before)
const firebaseConfig = { /* ... aapka config ... */ };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { userId, platform, roomId, text, senderName } = req.body;

  try {
    // 1. Firebase se AI Config uthao
    const aiSnap = await getDoc(doc(db, "configs", userId, "ai", "gemini"));
    if (!aiSnap.exists() || aiSnap.data().status !== 'active') return res.status(200).json({ msg: "AI Disabled" });

    const aiConfig = aiSnap.data();

    // 2. Check karo ki kya is platform par AI enabled hai
    if (!aiConfig.platforms[platform]) return res.status(200).json({ msg: "Platform Disabled" });

    // 3. Gemini Call
    const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
    const modelName = aiConfig.model === 'auto' ? 'gemini-1.5-flash' : aiConfig.model;
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${aiConfig.instructions}\n\nUser (${senderName}) said: ${text}\nReply:`;
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();

    // 4. Action: Usi Inbox mein message bhejo
    let apiUrl = '';
    if (platform === 'whatsapp') apiUrl = `https://${req.headers.host}/api/send-message`;
    if (platform === 'telegram') apiUrl = `https://${req.headers.host}/api/send-telegram`;
    if (platform === 'telegram-api') apiUrl = `https://${req.headers.host}/api/send-telegram-client`;

    await axios.post(apiUrl, { userId, to: roomId, text: aiReply });

    return res.status(200).json({ success: true, reply: aiReply });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
