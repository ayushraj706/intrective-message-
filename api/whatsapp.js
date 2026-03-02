import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- AAPKI FIXED IDs ---
const MY_PHONE_NUMBER_ID = "1027373887121315"; // Aapki Real Phone ID
const MY_WABA_ID = "902144092406469";          // Aapki WhatsApp Business Account ID

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. WEBHOOK VERIFICATION (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook Verified!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // 2. MESSAGE HANDLING (POST)
  if (req.method === 'POST') {
    const body = req.body;
    
    // Meta se jo data aaya use log mein dekhna (Davav banane ke liye monitoring zaruri hai)
    console.log(`📩 Incoming from WABA ID: ${body.entry?.[0]?.id || 'Unknown'}`);

    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const from = message.from; 

      // BUG FIX: Jis ID par message aaya hai, reply usi se jayega
      const activePhoneNumberId = value.metadata.phone_number_id; 

      console.log(`Reply switching to active ID: ${activePhoneNumberId}`);

      try {
        await axios.post(
          `https://graph.facebook.com/v18.0/${activePhoneNumberId}/messages`,
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
          { 
            headers: { 
              Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        console.log(`🚀 Success: Reply sent from ${activePhoneNumberId} to ${from}`);
        return res.status(200).json({ status: 'sent', waba_id: MY_WABA_ID });
      } catch (error) {
        console.error('❌ Meta API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to send' });
      }
    }
    return res.status(200).send('OK');
  }
}
