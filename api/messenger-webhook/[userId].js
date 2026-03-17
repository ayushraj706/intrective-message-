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
  const cleanId = decodeURIComponent(userId || '');

  // --- 1. VERIFICATION (GET) ---
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
          // 🔥 ASALI FIX: Meta ko response dene se pehle Firestore update karo
          await updateDoc(userRef, { 
            isFbVerified: true,
            verifiedAt: new Date() 
          });
          
          return res.status(200).send(challenge); 
        }
      }
      return res.status(403).send('Auth Failed');
    } catch (e) { return res.status(500).send('Error'); }
  }

  // --- 2. MESSAGE RECEIVE (POST) ---
  if (req.method === 'POST') {
    // ... (Incoming messages handling logic yahan aayega)
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.status(405).end();
}
