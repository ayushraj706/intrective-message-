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
  if (!userId) return res.status(400).send("ID Missing");

  // Strictly clean the ID (Email)
  const cleanId = decodeURIComponent(userId).toLowerCase().trim();

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
          // 🔥 REAL-TIME FIX: Pehle Database update, phir response
          await updateDoc(userRef, { 
            isFbVerified: true,
            status: 'active',
            lastVerified: new Date().toISOString()
          });

          console.log(`✅ Verified: ${cleanId}`);
          return res.status(200).send(challenge); 
        }
      }
      return res.status(403).send('Token Mismatch');
    } catch (err) {
      console.error("🔥 Webhook Error:", err.message);
      return res.status(500).send(err.message);
    }
  }

  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }
}
