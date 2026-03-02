
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Aapka Real Phone Number ID
const REAL_PHONE_ID = "1027373887121315"; 

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Webhook Verification (GET)
  if (req.method === 'GET') {
    return res.status(200).send(req.query['hub.challenge']);
  }

  // Message Handling (POST)
  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const incomingId = value.metadata.phone_number_id;

      // 1. BLOCK TEST NUMBER: Agar ID real wali nahi hai, toh block kar do
      if (incomingId !== REAL_PHONE_ID) {
        console.log(`🚫 Blocking test message from ID: ${incomingId}`);
        return res.status(200).send('Blocked'); 
      }

      // 2. ONLY PROCESS REAL NUMBER (+91 92299 66001)
      const from = value.messages[0].from;
      console.log(`✅ Received message on Real Number from: ${from}`);

      try {
        await axios.post(
          `https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: interactivePayload.content },
              action: {
                buttons: interactivePayload.content_attributes.items.map(item => ({
                  type: "reply",
                  reply: { id: item.value, title: item.title }
                }))
              }
            }
          },
          { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
        );
        return res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('❌ Meta API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed' });
      }
    }
    return res.status(200).send('OK');
  }
}
