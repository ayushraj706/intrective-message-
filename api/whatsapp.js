import axios from 'axios';
import fs from 'fs';
import path from 'path';

const REAL_PHONE_ID = "1027373887121315"; // Aapki ID

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "Guest"; // User ka naam

      let targetKey = "welcome"; // Default pehla message

      // Agar user ne button dabaya hai, toh uski ID ke hisaab se message dhundho
      if (msg.type === 'interactive') {
        targetKey = msg.interactive.button_reply.id;
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      
      // Variable Replace Logic: {{name}} ko asli naam se badal do
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

        return res.status(200).json({ status: 'success' });
      } catch (error) {
        console.error('❌ Meta Error:', error.response?.data || error.message);
        return res.status(500).send("Error");
      }
    }
    return res.status(200).send('OK');
  }
}
