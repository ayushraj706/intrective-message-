import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = { 
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
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
  const cleanId = decodeURIComponent(userId || '').toLowerCase().trim();

  // --- GET: Meta Handshake ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;
        if (mode === 'subscribe' && token === storedToken) {
          // 🔥 SYNC TRIGGER: Yahan true hoga tabhi dashboard badlega
          await updateDoc(userRef, { 
            isFbVerified: true, 
            status: 'active',
            updatedAt: new Date().toISOString()
          });
          return res.status(200).send(challenge); 
        }
      }
      return res.status(403).send('ID mismatch');
    } catch (e) { return res.status(500).send(e.message); }
  }

  // --- POST: Message Catcher ---
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body.object === 'page') {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging[0];
          await addDoc(collection(db, "users", cleanId, "messages"), {
            senderId: webhook_event.sender.id,
            text: webhook_event.message?.text || "Media Message",
            platform: 'facebook',
            type: 'incoming',
            timestamp: serverTimestamp()
          });
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) { return res.status(500).send("POST_ERR"); }
  }
}
