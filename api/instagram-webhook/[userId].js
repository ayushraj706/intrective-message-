import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = { 
  // Aapka original config...
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

  // Meta verification (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      try {
        const userRef = doc(db, "configs", cleanId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // 🔥 FIXED: Wahi naam jo React code save kar raha hai
          const storedToken = userSnap.data().insta_verify_token;
          
          if (mode === 'subscribe' && token === storedToken) {
            console.log("WEBHOOK_VERIFIED");
            
            // Background mein update karein (Meta ko wait mat karwayein)
            updateDoc(userRef, { 
              isInstaVerified: true, 
              verifiedAt: new Date() 
            }).catch(e => console.error("Update error:", e));
            
            return res.status(200).send(challenge); 
          }
        }
        return res.status(403).send('Forbidden: Token Mismatch');
      } catch (e) { 
        return res.status(500).send('Internal Server Error'); 
      }
    }
  }

  // Real-time Messages (POST)
  if (req.method === 'POST') {
    const body = req.body;
    console.log("Message Received:", JSON.stringify(body));

    if (body.object === 'instagram' || body.object === 'page') {
      // Yahan aap apna bot logic likhenge jo message ka reply karega
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not an Instagram event');
  }

  res.status(405).end(); // Method Not Allowed
}
