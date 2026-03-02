import axios from 'axios';
import fs from 'fs';
import path from 'path';

const REAL_PHONE_ID = "1027373887121315"; //

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";

      let targetKey = "welcome"; 
      
      // Check for button or list clicks
      if (msg.type === 'interactive') {
        targetKey = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id || "welcome";
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const finalBody = currentMsg.body.replace("{{name}}", userName);
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        let payload = { messaging_product: "whatsapp", to: from };

        // 1. LIST MESSAGE (Jab 3 se zyada buttons chahiye hon)
        if (currentMsg.type === "list") {
          payload.type = "interactive";
          payload.interactive = {
            type: "list",
            body: { text: finalBody },
            action: {
              button: "Chuniye Option",
              sections: [{ title: "Main Menu", rows: currentMsg.rows }]
            }
          };
        } 
        // 2. URL BUTTON
        else if (currentMsg.type === "cta_url") {
          payload.type = "interactive";
          payload.interactive = {
            type: "cta_url",
            body: { text: finalBody },
            action: { name: "cta_url", parameters: { display_text: currentMsg.button_text, url: currentMsg.url } }
          };
        }
        // 3. NORMAL BUTTONS
        else {
          payload.type = "interactive";
          payload.interactive = {
            type: "button",
            body: { text: finalBody },
            action: { buttons: currentMsg.buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })) }
          };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        return res.status(200).send('OK');
      } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return res.status(500).send("Error");
      }
    }
    return res.status(200).send('OK');
  }
}
