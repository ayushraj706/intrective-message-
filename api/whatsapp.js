import axios from 'axios';
import interactivePayload from '../interactive-message.json';

export default async function handler(req, res) {
  // --- PART 1: WEBHOOK VERIFICATION (Meta ke liye) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook Verified Successfully!');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Forbidden');
      }
    }
  }

  // --- PART 2: MESSAGE HANDLING & REPLY ---
  if (req.method === 'POST') {
    const body = req.body;

    // Vercel Log mein message dekhein
    console.log('📩 Incoming Message:', JSON.stringify(body, null, 2));

    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // User ka phone number
      const msgBody = message.text ? message.text.body : "Interactive Click";

      console.log(`From: ${from}, Message: ${msgBody}`);

      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        // Meta API ko reply bhej rahe hain
        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: interactivePayload.content_attributes ? {
              type: "button",
              body: { text: interactivePayload.content },
              action: {
                buttons: interactivePayload.content_attributes.items.map(item => ({
                  type: "reply",
                  reply: { id: item.value, title: item.title }
                }))
              }
            } : interactivePayload // Agar simple JSON hai
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log('🚀 Reply Sent Successfully!', response.data);
        return res.status(200).json({ status: 'sent' });

      } catch (error) {
        console.error('❌ Error sending reply:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to send reply' });
      }
    }
    return res.status(200).send('Event received but not a message');
  }

  res.status(405).send('Method Not Allowed');
}

