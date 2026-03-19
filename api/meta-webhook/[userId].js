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

  // --- 1. GET: Handshake Verification (Meta Check) ---
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
          await updateDoc(userRef, { 
            isFbVerified: true, 
            isIgVerified: true, 
            isVerified: true,
            status: 'active',
            updatedAt: new Date().toISOString()
          });
          return res.status(200).send(challenge); 
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (e) { return res.status(500).send(e.message); }
  }

  // --- 2. POST: Incoming Messages (The Real Deal) ---
  if (req.method === 'POST') {
    const body = req.body;

    // Check karo ki ye Meta Page ka event hai ya nahi
    if (body.object === 'page') {
      try {
        // Meta data ko loop mein process karna padta hai
        for (const entry of body.entry) {
          const webhook_event = entry.messaging[0];
          const senderId = webhook_event.sender.id; // Customer ki Unique ID

          let messagePayload = {
            senderId: senderId,
            platform: 'facebook',
            type: 'incoming', // Bahar se aaya message
            status: 'unread',
            timestamp: serverTimestamp()
          };

          // A. Handle Text Messages
          if (webhook_event.message?.text) {
            messagePayload.text = webhook_event.message.text;
          }

          // B. Handle Media (Images/Audio/Video)
          if (webhook_event.message?.attachments) {
            const attachment = webhook_event.message.attachments[0];
            messagePayload.mediaType = attachment.type; // 'image', 'audio', etc.
            messagePayload.mediaUrl = attachment.payload.url;
          }

          // 🔥 DATABASE MEIN SAVE: users/{email}/messages/...
          if (messagePayload.text || messagePayload.mediaUrl) {
            const msgRef = collection(db, "users", cleanId, "messages");
            await addDoc(msgRef, messagePayload);
            console.log(`📥 [SAVED] New message from ${senderId} to ${cleanId}`);
          }
        }
        
        return res.status(200).send('EVENT_RECEIVED');
      } catch (err) {
        console.error("🔥 Webhook POST Error:", err.message);
        return res.status(500).send("Internal Server Error");
      }
    }
    return res.status(404).send('Not a page event');
  }

  res.status(405).end();
}
