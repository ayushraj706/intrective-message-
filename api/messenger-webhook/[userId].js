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
  if (!userId) return res.status(400).send("Bhai, URL mein Email/ID missing hai!");

  const cleanId = decodeURIComponent(userId).toLowerCase().trim();

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", cleanId);
      const userSnap = await getDoc(userRef);

      // --- SMART DIAGNOSTIC MODE (For Browser Hits) ---
      if (!mode) {
        if (!userSnap.exists()) {
          return res.status(200).send(`❌ ERROR: Document 'configs/${cleanId}' nahi mila! Pehle setup page par save karo.`);
        }
        const data = userSnap.data();
        return res.status(200).send(`
          ✅ NODE STATUS: Online
          📧 ID: ${cleanId}
          🔑 Stored Token: ${data.fbVerifyToken || 'Nahi mila'}
          📊 Verified: ${data.isFbVerified ? 'YES (Inbox khulna chahiye)' : 'NO (Verify and Save dabao)'}
          📝 Instruction: Meta Dashboard mein yahi Token dalo aur 'Verify' dabao.
        `);
      }

      // --- META HANDSHAKE LOGIC ---
      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;

        if (mode === 'subscribe' && token === storedToken) {
          // 🔥 AUTO-SYNC: Bina manual mehnat ke database update
          await updateDoc(userRef, { 
            isFbVerified: true,
            status: 'connected',
            lastVerified: new Date().toISOString()
          });
          
          return res.status(200).send(challenge); 
        } else {
          return res.status(403).send(`Token Mismatch! Received: ${token}, Expected: ${storedToken}`);
        }
      }
      return res.status(404).send('User Not Found in Database');
    } catch (err) {
      return res.status(500).send(`Critical Error: ${err.message}`);
    }
  }

  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }
}
