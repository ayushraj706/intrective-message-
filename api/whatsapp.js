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
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";

      // 1. Firebase Memory Check
      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userLang = userSnap.exists() ? userSnap.data().lang : null;

      let targetKey = "welcome";

      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        if (replyId.startsWith("lang_") && !["lang_1", "lang_2", "lang_3"].includes(replyId)) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang, name: userName }, { merge: true });
          targetKey = "welcome"; 
        } else {
          targetKey = replyId;
        }
      }

      // Agar bhasha set nahi hai, toh selection pe bhejien
      if (!userLang && !targetKey.startsWith("lang_")) {
        targetKey = "lang_1";
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const rawBody = currentMsg.body.replace("{{name}}", userName);
      const finalLang = userLang || "hi";

      try {
        // 🔥 AUTO-TRANSLATE BODY
        const transBody = await translate(rawBody, { to: finalLang });
        
        let payload = {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: { body: { text: transBody.text } }
        };

        // --- 2. DYNAMIC LIST HANDLING (Sanskrit Included) ---
        if (currentMsg.type === "list") {
          const transRows = await Promise.all(currentMsg.rows.map(async (row) => {
            // Language selection wale rows translate nahi honge
            if (targetKey.startsWith("lang_")) return row; 
            const t = await translate(row.title, { to: finalLang });
            return { id: row.id, title: t.text, description: row.description || "" };
          }));

          payload.interactive.type = "list";
          payload.interactive.action = {
            button: "Options",
            sections: [{ title: "Select", rows: transRows }]
          };
        } 
        // --- 3. DYNAMIC BUTTON HANDLING ---
        else if (currentMsg.type === "reply" || currentMsg.buttons) {
          const transButtons = await Promise.all(currentMsg.buttons.map(async (b) => {
            const t = await translate(b.title, { to: finalLang });
            return { type: "reply", reply: { id: b.id, title: t.text } };
          }));
          payload.interactive.type = "button";
          payload.interactive.action = { buttons: transButtons };
        }
        // --- 4. CTA URL HANDLING ---
        else if (currentMsg.type === "cta_url") {
          payload.interactive.type = "cta_url";
          payload.interactive.action = {
            name: "cta_url",
            parameters: { display_text: currentMsg.button_text, url: currentMsg.url }
          };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });

        return res.status(200).send('OK');
      } catch (error) {
        console.error('❌ Crash Error:', error.response?.data || error.message);
        return res.status(200).send('OK');
      }
    }
  }
  return res.status(200).send('OK');
}
