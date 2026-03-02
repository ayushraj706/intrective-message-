import axios from 'axios';
import fs from 'fs';
import path from 'path';

const REAL_PHONE_ID = "1027373887121315"; // Aapki ID

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;

      // --- CASE 1: Agar User ne "Hi" ya koi Text bheja ---
      if (msg.type === 'text') {
        await sendInteractive(from, payload.content, payload.content_attributes.items);
      } 

      // --- CASE 2: Agar User ne Button par Click kiya ---
      else if (msg.type === 'interactive') {
        const buttonId = msg.interactive.button_reply.id;

        if (buttonId === 'visit_website') {
          await sendText(from, "Hamari website yahan dekhein: https://ayus.fun");
        } else if (buttonId === 'chat_ai') {
          await sendText(from, "Zaroor! Main BaseKey AI hoon. Aap kya jaanna chahte hain?");
        } else if (buttonId === 'next_move') {
          await sendText(from, "Agla kadam: Hum aapke business ko grow karenge!");
        }
      }
    }
    return res.status(200).send('OK');
  }
}

// --- Helper Functions (Taaki code baar-baar na likhna pade) ---
async function sendText(to, text) {
  await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, {
    messaging_product: "whatsapp", to, type: "text", text: { body: text }
  }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
}

async function sendInteractive(to, text, buttons) {
  await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, {
    messaging_product: "whatsapp", to, type: "interactive",
    interactive: {
      type: "button", body: { text: text },
      action: { buttons: buttons.map(b => ({ type: "reply", reply: { id: b.value, title: b.title } })) }
    }
  }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
}
