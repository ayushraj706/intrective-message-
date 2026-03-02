import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const body = req.body;
    
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const value = body.entry[0].changes[0].value;
      const from = value.messages[0].from; 
      
      // 🔥 MASTER FIX: ID ab meta ke incoming data se dynamic uthayega
      // Agar +1 pe msg aaya toh +1 ki ID lega, agar +91 pe aaya toh +91 ki lega
      const activePhoneNumberId = value.metadata.phone_number_id; 
      
      console.log(`Dynamic Reply from ID: ${activePhoneNumberId} to User: ${from}`);

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
          { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
        );

        return res.status(200).json({ status: 'success', sent_from: activePhoneNumberId });
      } catch (error) {
        console.error('❌ Meta Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed' });
      }
    }
    return res.status(200).send('OK');
  }
  
  // Verification part... (GET method handle karein as usual)
  if (req.method === 'GET') {
    return res.status(200).send(req.query['hub.challenge']);
  }
}
