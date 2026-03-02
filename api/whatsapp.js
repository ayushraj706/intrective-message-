import axios from 'axios';
import fs from 'fs';
import path from 'path';

const REAL_PHONE_ID = "1027373887121315"; // Aapki +91 wali ID

// 'export default' likhna zaroori hai Vercel ke liye
export default async function handler(req, res) {
  try {
    const jsonPath = path.join(process.cwd(), 'interactive-message.json');
    const interactivePayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (req.method === 'GET') {
      return res.status(200).send(req.query['hub.challenge']);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const value = body.entry?.[0]?.changes?.[0]?.value;

      if (value && value.messages) {
        const incomingId = value.metadata.phone_number_id;

        // Agar +91 se message aaya hai
        if (incomingId === REAL_PHONE_ID) {
          const from = value.messages[0].from;
          console.log(`✅ Real Message Received from: ${from}`);

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
          return res.status(200).json({ status: 'sent' });
        }
      }
      return res.status(200).send('OK');
    }
  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    return res.status(500).send("Internal Error");
  }
}
