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

// Error check ke saath initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query; // e.g., ayushrajayushhh@gmail.com
  const cleanId = decodeURIComponent(userId || '');

  // Meta Dashboard verification ke liye (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`🔍 Handshake Request for: ${cleanId}`);

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("❌ Document not found for:", cleanId);
        return res.status(404).send('User Config Not Found');
      }

      const storedToken = userSnap.data().fbVerifyToken;
      
      if (mode === 'subscribe' && token === storedToken) {
        // 🔥 CRITICAL: Database update ko 'await' karna zaroori hai
        await updateDoc(userRef, { 
          isFbVerified: true,
          status: 'connected',
          lastVerified: new Date().toISOString()
        });

        console.log(`✅ ${cleanId} is now VERIFIED in Database`);
        return res.status(200).send(challenge); 
      } else {
        console.error("❌ Token Mismatch!");
        return res.status(403).send('Token Mismatch');
      }
    } catch (error) {
      console.error("🔥 Server Error during GET:", error.message);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Incoming messages handle karne ke liye (POST)
  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.status(405).end();
}
