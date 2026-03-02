import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // JSON ko manually read karne ka rasta (Sabse safe aur error-free)
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // --- 1. WEBHOOK VERIFICATION (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // --- 2. MESSAGE HANDLING (POST) ---
  if (req.method === 'POST') {
    const body = req.body;
    console.log('📩 Incoming Message:', JSON.stringify(body, null, 2));

    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; 
      
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
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
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log(`🚀 Reply sent to ${from}`);
        return res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed' });
      }
    }
    return res.status(200).send('OK');
  }
}
