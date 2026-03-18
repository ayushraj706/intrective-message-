import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = { 
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

// Error-free Initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // NEXT.JS logic: userId strictly comes from req.query
  const { userId } = req.query; 
  if (!userId) return res.status(400).send("No UserID");

  const cleanId = decodeURIComponent(userId).toLowerCase().trim();

  // --- GET: Meta Handshake Verification ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      // 1. Database se config dhoondo
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;

        if (mode === 'subscribe' && token === storedToken) {
          // 🔥 SYNC FIX: Pehle Database update karo, phir Meta ko reply do
          await updateDoc(userRef, { 
            isFbVerified: true,
            status: 'connected',
            lastVerified: new Date().toISOString()
          });

          // Meta ko sirf challenge text bhejna hai (Important!)
          return res.status(200).send(challenge); 
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (err) {
      console.error("🔥 Webhook Error:", err.message);
      return res.status(500).send("Internal Error");
    }
  }

  // --- POST: Incoming Messages ---
  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.status(405).end();
}
