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
  const { userId } = req.query; // Strictly UID
  const cleanId = decodeURIComponent(userId || '');

  // --- GET: META HANDSHAKE ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && token === userSnap.data().fbVerifyToken) {
        // 🔥 REAL-TIME FIX: Pehle update, phir response
        await updateDoc(userRef, { 
          isFbVerified: true, 
          status: 'online',
          verifiedAt: serverTimestamp() 
        });
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Auth Failed');
    } catch (e) { return res.status(500).send('Error'); }
  }

  // --- POST: INCOMING MESSAGES (Media + Text) ---
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          const event = entry.messaging[0];
          const senderId = event.sender.id;
          
          let messageData = {
            senderId,
            platform: 'facebook',
            type: 'incoming',
            timestamp: serverTimestamp(),
            status: 'delivered'
          };

          // Handle Text
          if (event.message?.text) {
            messageData.text = event.message.text;
          }

          // 🔥 FEATURE: Handle Media (Images, Audio, Video)
          if (event.message?.attachments) {
            const attachment = event.message.attachments[0];
            messageData.mediaType = attachment.type; // 'image', 'audio', 'video'
            messageData.mediaUrl = attachment.payload.url;
          }

          if (messageData.text || messageData.mediaUrl) {
            await addDoc(collection(db, "users", cleanId, "messages"), messageData);
          }
        }
        return res.status(200).send('EVENT_RECEIVED');
      } catch (err) { return res.status(500).send("Error"); }
    }
    return res.status(404).send("Not a Page Event");
  }
}
