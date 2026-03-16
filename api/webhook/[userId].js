import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import axios from "axios";

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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

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
          await updateDoc(userRef, { isVerified: true });
          return res.status(200).send(challenge);
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (error) { return res.status(500).send('Server Error'); }
  }

  // --- 3. RECEIVING MESSAGES & STATUSES (POST) ---
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value) {
        const value = body.entry[0].changes[0].value;

        // SCENARIO A: Naya Message (Incoming)
        if (value.messages && value.messages.length > 0) {
          const message = value.messages[0];
          const contact = value.contacts?.[0];
          const senderNumber = message.from;
          const messageText = message.text?.body || "📷 Media Message";
          const senderName = contact?.profile?.name || "Customer";

          console.log(`📩 New message from ${senderNumber}: ${messageText}`);

          // A.1: Save to Firebase
          await addDoc(collection(db, "users", userId, "messages"), {
            text: messageText,
            sender: 'customer',
            senderNumber: senderNumber,
            senderName: senderName,
            wamid: message.id, 
            timestamp: serverTimestamp(),
            roomId: senderNumber,
            status: 'received',
            platform: 'whatsapp'
          });

          // A.2: --- NEURAL AI TRIGGER (ZAROORI UPDATE) ---
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          const baseUrl = `${protocol}://${req.headers.host}`;
          
          console.log("🤖 Attempting to notify AI Brain...");
          try {
            // AWAIT lagana zaroori hai taaki Vercel process kill na kare
            await axios.post(`${baseUrl}/api/ai-handler`, {
              userId, platform: 'whatsapp', roomId: senderNumber, text: messageText, senderName
            }, { timeout: 10000 });
            console.log("✅ AI Trigger Successful!");
          } catch (err) { console.log("❌ AI Trigger Error:", err.message); }

          return res.status(200).json({ status: 'success' });
        }

        // SCENARIO B: Status Updates (Ticks)
        if (value.statuses && value.statuses.length > 0) {
          const statusObj = value.statuses[0];
          const wamid = statusObj.id;
          const currentStatus = statusObj.status;
          const messagesRef = collection(db, "users", userId, "messages");
          const q = query(messagesRef, where("wamid", "==", wamid));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (document) => {
            await updateDoc(document.ref, { status: currentStatus, updatedAt: serverTimestamp() });
          });
          return res.status(200).json({ status: 'status_updated' });
        }
      }
      return res.status(200).json({ status: 'ignored_event' });
    } catch (error) { return res.status(500).json({ error: 'Internal Server Error' }); }
  }
  res.status(405).end();
}
