import axios from 'axios';
// Node.js 24 mein JSON import ke liye 'with { type: "json" }' likhna zaroori hai
import interactivePayload from '../interactive-message.json' with { type: 'json' };

export default async function handler(req, res) {
  
  // --- 1. WEBHOOK VERIFICATION (GET Request) ---
  // Meta isi raste se check karega ki aapka server sahi hai ya nahi
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Aapke Vercel variables se token check karega
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

    // Vercel Logs mein pura message dikhega ki kisne kya bheja
    console.log('📩 Incoming Webhook:', JSON.stringify(body, null, 2));

    // Check karein ki kya ye ek valid WhatsApp message hai
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // User ka WhatsApp number
      
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        // Meta API ko Interactive Message (Buttons) bhej rahe hain
        await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: interactivePayload.content }, // JSON se text uthayega
              action: {
                buttons: interactivePayload.content_attributes.items.map(item => ({
                  type: "reply",
                  reply: { id: item.value, title: item.title } // JSON se buttons banayega
                }))
              }
            }
          },
          { 
            headers: { 
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        console.log(`🚀 Interactive Reply sent successfully to ${from}`);
        return res.status(200).json({ status: 'success' });

      } catch (error) {
        // Agar reply fail ho jaye toh yahan error dikhega
        console.error('❌ Meta API Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to send reply' });
      }
    }

    // Kuch aur status (read receipts etc.) aaye toh bas 200 OK bhej do
    return res.status(200).send('EVENT_RECEIVED');
  }

  // Agar koi aur request (like PUT/DELETE) aaye
  res.status(405).send('Method Not Allowed');
}
