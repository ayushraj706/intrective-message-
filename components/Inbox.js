import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export default async function handler(req, res) {
  // सिर्फ POST रिक्वेस्ट की अनुमति दें
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, to, text } = req.body;

  // पक्का करें कि डेटा आ रहा है
  if (!to || !text || !userId) {
    return res.status(400).json({ error: "Missing data: 'to', 'text' or 'userId' is empty." });
  }

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  // अगर एन्वायरमेंट वेरिएबल्स नहीं मिले
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return res.status(500).json({ error: "Server Error: WhatsApp Token or ID is missing in .env.local" });
  }

  try {
    // 1. व्हाट्सएप को असली मैसेज भेजना (साफ़-सुथरा तरीका)
    const response = await axios({
      method: 'post',
      url: `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace('+', ''), // व्हाट्सएप कभी-कभी बिना + के नंबर माँगता है
        type: "text",
        text: { preview_url: false, body: text },
      }
    });

    // 2. फायरबेस में मैसेज सेव करना ताकि Inbox में दिखे
    const msgData = {
      sender: 'admin',
      senderNumber: to,
      text: text,
      timestamp: serverTimestamp(),
      messageId: response.data.messages[0].id
    };

    await addDoc(collection(db, "users", userId, "messages"), msgData);

    return res.status(200).json({ success: true, messageId: response.data.messages[0].id });

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("WhatsApp API Error Detail:", JSON.stringify(errorMsg, null, 2));
    
    return res.status(500).json({ 
      error: "WhatsApp API ने मैसेज रिजेक्ट कर दिया", 
      details: errorMsg 
    });
  }
}
