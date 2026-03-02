import axios from 'axios';
import fs from 'fs';
import path from 'path';

const REAL_PHONE_ID = "1027373887121315"; // Aapki ID

export default async function handler(req, res) {
  // 1. JSON Load Check
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  let messagesDB;
  try {
    messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error("❌ JSON Read Error:", err.message);
    return res.status(500).send("JSON Error");
  }

  if (req.method === 'GET') return res.status(200).send(req.query['hub.challenge']);

  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "Customer";

      let targetKey = "welcome"; 

      // Button click handle karo
      if (msg.type === 'interactive') {
        targetKey = msg.interactive.button_reply.id;
      }

      // Agar JSON mein wo key nahi mili, toh welcome par bhej do
      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      
      // Name replace logic
      const finalBody = currentMsg.body.replace("{{name}}", userName);

      try {
        await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: finalBody },
            action: {
              buttons: currentMsg.buttons.map(b => ({
                type: "reply",
                reply: { id: b.id, title: b.title }
              }))
            }
          }
        }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

        return res.status(200).json({ status: 'sent' });
      } catch (error) {
        console.error('❌ Meta Error:', error.response?.data || error.message);
        return res.status(500).send("Meta Error");
      }
    }
    return res.status(200).send('OK');
  }
}
