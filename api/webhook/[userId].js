import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import axios from "axios"; // Naya Import

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1",
  measurementId: "G-64DR1TSTKY"
};

// Singleton pattern to avoid re-initialization errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    console.error("❌ Webhook Error: userId missing in URL");
    return res.status(400).json({ error: "User ID is required" });
  }

  // --- 2. WEBHOOK VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().webhookVerifyToken;

        if (mode === 'subscribe' && token === storedToken) {
          console.log(`✅ Webhook Verified for: ${userId}`);
          await updateDoc(userRef, { isVerified: true });
          return res.status(200).send(challenge);
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(500).send('Server Error');
    }
  }

  // --- 3. RECEIVING MESSAGES & STATUSES (POST) ---
  if (req.method === 'POST') {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value) {
        const value = body.entry[0].changes[0].value;

        // ==========================================
        // SCENARIO A: Naya Message Aaya Hai (Incoming)
        // ==========================================
        if (value.messages && value.messages.length > 0) {
          const message = value.messages[0];
          const contact = value.contacts?.[0];

          const senderNumber = message.from;
          const messageText = message.text?.body || "📷 Media Message";
          const senderName = contact?.profile?.name || "Customer";
          const wamid = message.id; // WhatsApp ka unique Message ID

          console.log(`📩 New message from ${senderNumber}: ${messageText}`);

          // --- AAPKA MEHNAT WALA SAVE LOGIC ---
          await addDoc(collection(db, "users", userId, "messages"), {
            text: messageText,
            sender: 'customer',
            senderNumber: senderNumber,
            senderName: senderName,
            wamid: wamid, 
            timestamp: serverTimestamp(),
            roomId: senderNumber,
            status: 'received',
            platform: 'whatsapp' // Room identification ke liye zaroori
          });

          // --- NAYA AI TRIGGER (Vercel Brain Link) ---
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const baseUrl = `${protocol}://${req.headers.host}`;
          
          // Bina wait kiye AI handler ko call bhej rahe hain
          axios.post(`${baseUrl}/api/ai-handler`, {
            userId: userId,
            platform: 'whatsapp',
            roomId: senderNumber,
            text: messageText,
            senderName: senderName
          }).catch(err => console.log("🤖 WhatsApp AI Trigger Failed:", err.message));

          return res.status(200).json({ status: 'success' });
        }

        // ==========================================
        // SCENARIO B: Message Status Badla Hai (Ticks)
        // ==========================================
        if (value.statuses && value.statuses.length > 0) {
          const statusObj = value.statuses[0];
          const wamid = statusObj.id; 
          const currentStatus = statusObj.status; 

          console.log(`🔄 Status Update: Message ${wamid} is now ${currentStatus}`);

          const messagesRef = collection(db, "users", userId, "messages");
          const q = query(messagesRef, where("wamid", "==", wamid));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(async (document) => {
            await updateDoc(document.ref, { 
                status: currentStatus,
                updatedAt: serverTimestamp() 
            });
          });

          return res.status(200).json({ status: 'status_updated' });
        }
      }

      return res.status(200).json({ status: 'ignored_event' });

    } catch (error) {
      console.error("🔥 Webhook Post Error:", error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.status(405).end();
}
