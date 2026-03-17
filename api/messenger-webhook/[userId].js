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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;

  // LOG 1: Sabse pehle ye check karega ki request aayi ya nahi
  console.log("🚀 Webhook Triggered for User:", userId);

  if (!userId || userId === 'undefined') return res.status(400).send("ID missing");
  const cleanId = decodeURIComponent(userId);

  // --- VERIFICATION (GET REQUEST) ---
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
          console.log("✅ Handshake Success!");
          await updateDoc(userRef, { isFbVerified: true });
          return res.status(200).send(challenge); // Meta expects PLAIN TEXT
        }
      }
      return res.status(403).send('Auth Failed');
    } catch (e) { return res.status(500).send('Server Error'); }
  }

  // --- MESSAGE RECEIVE (POST REQUEST) ---
  if (req.method === 'POST') {
    // Abhi ke liye sirf OK bhej rahe hain, verification ke baad isme logic dalenge
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.status(405).end();
}
