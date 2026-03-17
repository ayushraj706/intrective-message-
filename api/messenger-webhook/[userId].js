import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8", // Aapka config
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  // --- VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const userSnap = await getDoc(doc(db, "configs", userId));
    const storedToken = userSnap.data()?.fbVerifyToken; // Alag token for FB

    if (mode === 'subscribe' && token === storedToken) {
      await updateDoc(doc(db, "configs", userId), { isFbVerified: true });
      return res.status(200).send(challenge);
    }
    return res.status(403).send('FB Verification Failed');
  }

  // --- RECEIVING MESSAGES (POST) ---
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'page') {
      try {
        const entry = body.entry[0].messaging[0];
        const senderId = entry.sender.id;
        const messageText = entry.message?.text || "📷 Media/Attachment";

        if (entry.message && !entry.message.is_echo) {
          // 1. Save to Firebase (Same as WhatsApp)
          await addDoc(collection(db, "users", userId, "messages"), {
            text: messageText,
            sender: 'customer',
            senderNumber: senderId,
            senderName: "FB User",
            wamid: entry.message.mid,
            timestamp: serverTimestamp(),
            roomId: senderId,
            status: 'received',
            platform: 'facebook'
          });

          // 2. Trigger AI Brain
          const baseUrl = `https://${req.headers.host}`;
          await axios.post(`${baseUrl}/api/ai-handler`, {
            userId, platform: 'facebook', roomId: senderId, text: messageText, senderName: "FB User"
          }).catch(e => console.log("AI Error"));
        }
        return res.status(200).send('EVENT_RECEIVED');
      } catch (err) { return res.status(500).send('Error'); }
    }
  }
  res.status(405).end();
}
