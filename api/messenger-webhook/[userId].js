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
  const { userId } = req.query; // Ye wahi email/ID hai jo URL mein hai

  if (!userId || userId === 'undefined') {
    return res.status(400).send("ID missing");
  }

  const cleanId = decodeURIComponent(userId);
  console.log("🚀 Webhook Request for:", cleanId);

  // --- META VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      // Frontend ne document email ke naam se save kiya hai
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;
        
        if (mode === 'subscribe' && token === storedToken) {
          console.log(`✅ Handshake Success for ${cleanId}`);
          
          // Firestore mein status update karo taaki Frontend modal "Green" ho jaye
          await updateDoc(userRef, { isFbVerified: true });
          
          return res.status(200).send(challenge);
        }
        console.error("❌ Token Mismatch!");
      } else {
        console.error("❌ User Config not found in Firestore!");
      }
      return res.status(403).send('Verification Failed');
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  // --- MESSAGE RECEIVE (POST) ---
  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.status(405).end();
}
