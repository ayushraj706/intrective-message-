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
  const cleanId = decodeURIComponent(userId || '').toLowerCase().trim();

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`🚀 [WEBHOOK START] Incoming request for ID: ${cleanId}`);

    try {
      // Step 1: Document dhoondo
      const userRef = doc(db, "configs", cleanId);
      console.log(`📂 [STEP 1] Looking for document at path: configs/${cleanId}`);
      
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error(`❌ [ERROR] Document 'configs/${cleanId}' NOT FOUND. Make sure you saved details in setup page first.`);
        return res.status(404).json({ error: "Config document missing", path: `configs/${cleanId}` });
      }

      const data = userSnap.data();
      const storedToken = data.fbVerifyToken;
      console.log(`🔑 [STEP 2] Token Match Check -> Received: ${token} | Stored: ${storedToken}`);
      
      if (mode === 'subscribe' && token === storedToken) {
        
        console.log(`⚙️ [STEP 3] Tokens matched! Attempting Database Update...`);

        // Step 3: Database Update with detailed Error Catching
        try {
          await updateDoc(userRef, { 
            isFbVerified: true,
            status: 'active',
            lastVerifiedAt: new Date().toISOString()
          });
          
          console.log(`✅ [SUCCESS] Database updated for ${cleanId}. Handshake complete.`);
          
          // Meta ko success bhejo
          return res.status(200).send(challenge);

        } catch (dbError) {
          console.error(`❌ [DB ERROR] Update failed: ${dbError.message}`);
          return res.status(500).json({ error: "Firestore update failed", detail: dbError.message });
        }

      } else {
        console.error(`❌ [ERROR] Token mismatch or invalid mode. Mode: ${mode}`);
        return res.status(403).send('Token mismatch');
      }

    } catch (globalError) { 
      console.error(`🔥 [CRITICAL ERROR] Webhook crashed: ${globalError.message}`);
      return res.status(500).json({ error: globalError.message }); 
    }
  }

  // Messenger message receiving logic
  if (req.method === 'POST') {
    console.log("📥 [POST] New message event received from Meta.");
    return res.status(200).send('EVENT_RECEIVED');
  }
}
