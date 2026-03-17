import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  const { userId } = req.query; // Ye wahi email/UID hai jo URL mein hai
  const cleanId = decodeURIComponent(userId || '');

  // --- 1. VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && token === userSnap.data().fbVerifyToken) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Auth Failed');
    } catch (e) { return res.status(500).send('Error'); }
  }

  // --- 2. MESSAGE RECEIVE & SAVE (POST) ---
  if (req.method === 'POST') {
    const body = req.body;

    // Check karo ki ye Messenger page ka event hai
    if (body.object === 'page') {
      try {
        // Meta data ko loop karna padta hai (Entry -> Messaging)
        for (const entry of body.entry) {
          const webhook_event = entry.messaging[0];
          
          // Agar message text aaya hai
          if (webhook_event.message && webhook_event.message.text) {
            const senderId = webhook_event.sender.id; // FB User ID
            const messageText = webhook_event.message.text;

            console.log(`📥 New Message from ${senderId}: ${messageText}`);

            // --- NEURAL SAVE LOGIC ---
            // Hum messages ko users/[userEmail]/messages mein save kar rahe hain
            await addDoc(collection(db, "users", cleanId, "messages"), {
              senderId: senderId,
              text: messageText,
              platform: 'facebook',
              type: 'incoming', // Incoming matlab customer ne bheja
              status: 'received',
              timestamp: serverTimestamp()
            });
          }
        }
        // Meta ko 200 OK dena zaroori hai warna wo baar baar bhejta rahega
        return res.status(200).send('EVENT_RECEIVED');
      } catch (err) {
        console.error("🔥 Firestore Save Error:", err.message);
        return res.status(500).send("Internal Server Error");
      }
    }
    return res.status(404).send("Not a Page Event");
  }

  res.status(405).end();
}
