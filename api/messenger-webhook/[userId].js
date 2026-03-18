import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = { 
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

// Safe App Initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // URL parameters se User Email (ID) nikaalna
  const { userId } = req.query; 
  if (!userId) return res.status(400).send("Identifier Missing");

  const cleanId = decodeURIComponent(userId).toLowerCase().trim();

  // --- 1. GET: META HANDSHAKE (Verification) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`🚀 [WEBHOOK] Handshake started for: ${cleanId}`);

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;
        
        if (mode === 'subscribe' && token === storedToken) {
          // 🔥 REAL-TIME SYNC: Dashboard ko 'True' signal bhej rahe hain
          await updateDoc(userRef, { 
            isFbVerified: true,
            status: 'connected',
            lastVerified: new Date().toISOString()
          });
          
          console.log(`✅ [SUCCESS] ${cleanId} verified and updated in DB.`);
          return res.status(200).send(challenge); 
        } else {
          console.error("❌ [ERROR] Token mismatch.");
          return res.status(403).send('Token Mismatch');
        }
      } else {
        console.error(`❌ [ERROR] Config not found for: ${cleanId}`);
        return res.status(404).send('User Not Found');
      }
    } catch (e) { 
      console.error(`🔥 [CRITICAL] Webhook Crash: ${e.message}`);
      return res.status(500).json({ error: "Server Crash", detail: e.message }); 
    }
  }

  // --- 2. POST: INCOMING MESSAGES (The Real Automation) ---
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          if (!entry.messaging) continue;
          
          const webhook_event = entry.messaging[0];
          const senderId = webhook_event.sender.id; // Customer's FB ID

          let messagePayload = {
            senderId: senderId,
            platform: 'facebook',
            type: 'incoming',
            status: 'received',
            timestamp: serverTimestamp()
          };

          // A. Handle Text Messages
          if (webhook_event.message?.text) {
            messagePayload.text = webhook_event.message.text;
          }

          // B. Handle Media (Images, Audio, Video, Files)
          if (webhook_event.message?.attachments) {
            const attachment = webhook_event.message.attachments[0];
            messagePayload.mediaType = attachment.type; // 'image', 'audio', 'video', 'file'
            messagePayload.mediaUrl = attachment.payload.url;
          }

          // 🔥 Firestore mein message save karein
          if (messagePayload.text || messagePayload.mediaUrl) {
            await addDoc(collection(db, "users", cleanId, "messages"), messagePayload);
            console.log(`📥 [MESSAGE] Saved from ${senderId} to ${cleanId}`);
          }
        }
        return res.status(200).send('EVENT_RECEIVED');
      } catch (err) {
        console.error("🔥 [POST ERROR] Failed to save message:", err.message);
        return res.status(500).send("Internal Server Error");
      }
    }
    return res.status(404).send("Not a Page Event");
  }

  res.status(405).end(); // Method Not Allowed
}
