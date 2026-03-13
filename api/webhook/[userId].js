import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// --- 1. FIREBASE CONFIGURATION (Ekdum Sahi Hai) ---
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
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

  // --- 3. RECEIVING MESSAGES (POST) ---
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Check if it's a WhatsApp message
      if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const contact = value.contacts?.[0];

        const senderNumber = message.from;
        const messageText = message.text?.body || "📷 Media Message";
        const senderName = contact?.profile?.name || "Customer";

        console.log(`📩 New message from ${senderNumber}: ${messageText}`);

        // डेटा को 'users/[userId]/messages' में सेव करना
        await addDoc(collection(db, "users", userId, "messages"), {
          text: messageText,
          sender: 'customer',
          senderNumber: senderNumber,
          senderName: senderName,
          timestamp: serverTimestamp(),
          roomId: senderNumber // साजन कुमार या किसी और कस्टमर की चैट पहचानने के लिए
        });

        return res.status(200).json({ status: 'success' });
      }

      // स्टेटस अपडेट (Delivered, Read) को इग्नोर करना ताकि सर्वर क्रैश न हो
      return res.status(200).json({ status: 'ignored_status_update' });

    } catch (error) {
      console.error("🔥 Webhook Post Error:", error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.status(405).end();
}
