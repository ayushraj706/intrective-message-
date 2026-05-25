import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Yahan mediaUrl aur mediaType bhi aayega
  const { userId, to, text, mediaUrl, mediaType } = req.body;

  if (!userId || !to) return res.status(400).json({ error: "Data missing" });

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { telegramBotToken } = configSnap.data();

    if (!telegramBotToken) return res.status(400).json({ error: "Telegram Bot Token not configured." });

    let tgRes;
    
    // --- MEDIA BHEJNE KA LOGIC ---
    if (mediaUrl) {
      if (mediaType === 'image') {
        tgRes = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, {
          chat_id: to,
          photo: mediaUrl,
          caption: text || "" // Agar photo ke sath text hai
        });
      } else {
        tgRes = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendDocument`, {
          chat_id: to,
          document: mediaUrl,
          caption: text || ""
        });
      }
    } 
    // --- SIRF TEXT BHEJNE KA LOGIC ---
    else {
      tgRes = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        chat_id: to,
        text: text
      });
    }

    const wamid = tgRes.data.result.message_id.toString();

    // Firebase mein save karna
    await addDoc(collection(db, "users", userId, "messages"), {
      text: text || (mediaType === 'image' ? "📷 Photo" : "📄 File"), 
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      sender: 'admin', 
      senderNumber: to, 
      wamid: wamid,
      status: 'sent', // Telegram mein hamesha 'sent' rahega
      platform: 'telegram', 
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram Send Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send Telegram message" });
  }
}
