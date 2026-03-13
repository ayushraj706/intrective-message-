import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // URL से userId निकालना (जैसे: /api/webhook/ABC_123)
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required in URL" });
  }

  // --- 2. WEBHOOK VERIFICATION (GET) ---
  // यह हिस्सा तब चलता है जब आप Meta Portal पर 'Verify' बटन दबाते हैं
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      // Firestore से इस खास यूजर का 'verify_token' निकालें
      const userRef = doc(db, "configs", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().webhookVerifyToken;

        if (mode === 'subscribe' && token === storedToken) {
          console.log(`✅ Webhook Verified for User: ${userId}`);
          
          // डेटाबेस में 'isVerified' को true कर दें ताकि डैशबोर्ड पर 'Done' बटन खुल जाए
          await updateDoc(userRef, { isVerified: true });
          
          return res.status(200).send(challenge);
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (error) {
      console.error("Auth Error:", error);
      return res.status(500).send('Server Error');
    }
  }

  // --- 3. RECEIVING MESSAGES (POST) ---
  // यह हिस्सा तब चलता है जब कोई कस्टमर व्हाट्सएप पर मैसेज भेजता है
  if (req.method === 'POST') {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const contact = value.contacts?.[0];

        const senderNumber = message.from;
        const messageText = message.text?.body || "Media/System Message";
        const senderName = contact?.profile?.name || "Customer";

        // --- डेटा को यूजर के पर्सनल सब-कलेक्शन में सेव करना ---
        // रास्ता: users -> [userId] -> messages
        await addDoc(collection(db, "users", userId, "messages"), {
          text: messageText,
          sender: 'customer',
          senderNumber: senderNumber,
          senderName: senderName,
          timestamp: serverTimestamp(),
          roomId: senderNumber 
        });

        return res.status(200).json({ status: 'success' });
      }
      
      return res.status(200).json({ status: 'ignored' });
    } catch (error) {
      console.error("Message Error:", error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.status(405).end(); // Method Not Allowed
}
