import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // --- 1. WEBHOOK VERIFICATION ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // --- 2. MESSAGE HANDLING (Bug Fix Included) ---
  if (req.method === 'POST') {
    const body = req.body;
    console.log('📩 Incoming Webhook:', JSON.stringify(body, null, 2));

    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const from = message.from; 
      
      // 🔥 BUG FIX: ID ab environment se nahi, balki Meta ke incoming message se aayegi
      const phoneNumberId = value.metadata.phone_number_id; 
      const wabaId = body.entry[0].id; // WhatsApp Business Account ID

      console.log(`Sending from ID: ${phoneNumberId} (WABA: ${wabaId}) to User: ${from}`);

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

        return res.status(200).json({ status: 'success', sent_from: phoneNumberId });
      } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed' });
      }
    }
    return res.status(200).send('OK');
  }
}
