import { db } from '../../firebase'; // अपने फायरबेस कॉन्फिग का सही पाथ दें
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, to, text } = req.body;

  // ये वैल्यूज तुम्हें अपने Meta Developer Dashboard से मिलेंगी
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  try {
    // 1. व्हाट्सएप को असली मैसेज भेजना
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to, // कस्टमर का नंबर
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 2. फायरबेस में मैसेज सेव करना ताकि Inbox में तुरंत दिखे
    await addDoc(collection(db, "users", userId, "messages"), {
      sender: 'admin',
      senderNumber: to,
      text: text,
      timestamp: serverTimestamp(),
      messageId: response.data.messages[0].id // व्हाट्सएप का मैसेज ID
    });

    res.status(200).json({ success: true, messageId: response.data.messages[0].id });

  } catch (error) {
    console.error("WhatsApp API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Message sending failed", 
      details: error.response?.data || error.message 
    });
  }
}
