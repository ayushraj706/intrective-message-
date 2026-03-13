import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  const { userId } = req.query; // URL से User ID निकालो

  // 1. Firestore से इस यूजर का 'Verify Token' और 'Config' ढूंढो
  const configSnap = await getDoc(doc(db, "configs", userId));
  
  if (!configSnap.exists()) {
    return res.status(404).json({ error: "User configuration not found" });
  }

  const userConfig = configSnap.data();
  const userVerifyToken = userConfig.webhookVerifyToken; // हर यूजर का अपना टोकन

  // --- WEBHOOK VERIFICATION ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === userVerifyToken) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).end();
    }
  }

  // --- RECEIVING MESSAGES ---
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      
      // मैसेज को इस विशिष्ट यूजर के 'messages' सब-कलेक्शन में सेव करो
      await addDoc(collection(db, "users", userId, "messages"), {
        text: message.text?.body || "Media",
        sender: 'customer',
        senderNumber: message.from,
        timestamp: serverTimestamp(),
      });

      return res.status(200).json({ status: 'success' });
    }
  }

  res.status(405).end();
}
