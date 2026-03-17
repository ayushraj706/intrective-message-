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
  // 1. ZAROORI: URL se userId nikalna aur decode karna (@ ko handle karne ke liye)
  const { userId } = req.query;

  // 2. UNDEFINED CRASH FIX: Agar userId nahi hai toh yahi se return ho jao
  if (!userId || userId === 'undefined') {
    console.error("🔥 Path Failure: userId is missing or undefined");
    return res.status(400).send("User ID required");
  }

  // Email ko handle karne ke liye decode karo (e.g. ayush%40gmail.com -> ayush@gmail.com)
  const cleanId = decodeURIComponent(userId);

  // --- META VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      // Clean ID ka use karke Firestore se config uthao
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;
        
        // ZAROORI: Token match logic
        if (mode === 'subscribe' && token === storedToken) {
          console.log(`✅ Handshake Success for: ${cleanId}`);
          await updateDoc(userRef, { isFbVerified: true });
          
          // Meta expects PLAIN TEXT challenge
          return res.status(200).send(challenge);
        } else {
          console.error("❌ Token Mismatch:", { received: token, expected: storedToken });
        }
      } else {
        console.error(`❓ No config found in Firestore for ID: ${cleanId}`);
      }
      return res.status(403).send('Verification Failed');
    } catch (error) {
      console.error("🔥 Firestore Error:", error.message);
      return res.status(500).send('Server Error');
    }
  }

  // --- POST Logic (Coming Soon) ---
  res.status(405).end();
}
