import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import translate from 'google-translate-api-x';

const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const REAL_PHONE_ID = "1027373887121315";

export default async function handler(req, res) {

  // --- 1. META WEBHOOK VERIFICATION (GET) ---
  // Isse aapka "Verify and Save" wala error theek hoga
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Dashboard mein wahi token bharein jo yahan hai
    if (mode === 'subscribe' && token === 'Ayush@7859032663') {
      console.log('✅ Webhook Verified!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // --- 2. MESSAGE HANDLING LOGIC (POST) ---
  // Aapka sara purana logic yahan hai, kuch bhi delete nahi kiya gaya
  if (req.method === 'POST') {
    const jsonPath = path.join(process.cwd(), 'interactive-message.json');
    let messagesDB;
    
    try {
      messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error("JSON Error:", e.message);
      return res.status(200).send('OK');
    }

    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";

      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userLang = userSnap.exists() ? userSnap.data().lang : null;

      let targetKey = "welcome";

      // --- LANGUAGE SETTING LOGIC ---
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        if (replyId && replyId.startsWith("lang_") && !["lang_1", "lang_2", "lang_3"].includes(replyId)) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang, name: userName }, { merge: true });
          targetKey = "welcome"; 
        } else if (replyId) {
          targetKey = replyId;
        }
      }

      if (!userLang && !targetKey.startsWith("lang_")) targetKey = "lang_1";

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const rawBody = currentMsg.body.replace("{{name}}", userName);
      const finalLang = userLang || "hi";

      try {
        const transBody = await translate(rawBody, { to: finalLang });
        
        let payload = {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: { body: { text: transBody.text } }
        };

        if (currentMsg.type === "list") {
          const transRows = await Promise.all(currentMsg.rows.map(async (row) => {
            if (targetKey.startsWith("lang_")) return row; 
            const tTitle = await translate(row.title, { to: finalLang });
            const tDesc = await translate(row.description || "", { to: finalLang });
            return { id: row.id, title: tTitle.text, description: tDesc.text };
          }));
          
          const tBtnLabel = await translate("Options", { to: finalLang });
          payload.interactive.type = "list";
          payload.interactive.action = {
            button: tBtnLabel.text,
            sections: [{ title: "Menu", rows: transRows }]
          };
        } 
        else if (currentMsg.type === "reply" || currentMsg.buttons) {
          const transButtons = await Promise.all(currentMsg.buttons.map(async (b) => {
            const t = await translate(b.title, { to: finalLang });
            return { type: "reply", reply: { id: b.id, title: t.text } };
          }));
          payload.interactive.type = "button";
          payload.interactive.action = { buttons: transButtons };
        }
        else if (currentMsg.type === "cta_url") {
          const tBtnText = await translate(currentMsg.button_text, { to: finalLang });
          payload.interactive.type = "cta_url";
          payload.interactive.action = {
            name: "cta_url",
            parameters: { display_text: tBtnText.text, url: currentMsg.url }
          };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });

        return res.status(200).send('OK');
      } catch (error) {
        console.error('❌ API Error:', error.message);
        return res.status(200).send('OK');
      }
    }
  }

  return res.status(200).send('OK');
}
