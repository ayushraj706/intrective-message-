import axios from 'axios';
import interactivePayload from '../interactive-message.json';

export default async function handler(req, res) {
  // --- 1. WEBHOOK VERIFICATION (GET Request) ---
  // Meta isi raste se check karega ki aapka server sahi hai ya nahi
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook Verified Successfully!');
      return res.status(200).send(challenge);
    } else {
      console.error('❌ Verification Failed: Token Mismatch');
      return res.status(403).send('Forbidden');
    }
  }

  // --- 2. MESSAGE HANDLING (POST Request) ---
  if (req.method === 'POST') {
    const body = req.body;

    // Vercel Logs mein pura message dikhega
    console.log('📩 Incoming Webhook:', JSON.stringify(body, null, 2));

    // Check karein ki kya ye ek valid WhatsApp message hai
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // User ka WhatsApp number
      
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        // Meta API ko Interactive Message bhej rahe hain
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

        console.log(`🚀 Interactive Reply sent to ${from}`);
        return res.status(200).json({ status: 'success' });

      } catch (error) {
        console.error('❌ Meta API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to send reply' });
      }
    }

    // Kuch aur (like status updates) aaye toh 200 OK bhej do taaki Meta baar-baar na bheje
    return res.status(200).send('EVENT_RECEIVED');
  }

  // Agar GET ya POST ke alawa kuch aaye
  res.status(405).send('Method Not Allowed');
}
