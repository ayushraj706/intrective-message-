Import axios from 'axios';
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
const REAL_PHONE_ID = "1027373887121315"; //

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  const messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (req.method === 'POST') {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";

      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userLang = userSnap.exists() ? userSnap.data().lang : null;

      let targetKey = "welcome";

      // --- 1. LANGUAGE SETTING LOGIC ---
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

      if (!userLang && !targetKey.startsWith("lang_")) targetKey = "lang_1";

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const rawBody = currentMsg.body.replace("{{name}}", userName);
      const finalLang = userLang || "hi";

      try {
        // --- 2. DEEP TRANSLATION LOGIC (Body + Interactive Elements) ---
        // Deep Words ke liye hum translator ko standard target bhasha dete hain
        const transBody = await translate(rawBody, { to: finalLang });
        
        let payload = {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: { body: { text: transBody.text } }
        };

        // A. LIST TRANSLATION (All rows & descriptions)
        if (currentMsg.type === "list") {
          const transRows = await Promise.all(currentMsg.rows.map(async (row) => {
            if (targetKey.startsWith("lang_")) return row; // Lang list ko mat badlo
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
        // B. BUTTON TRANSLATION (All button titles)
        else if (currentMsg.type === "reply" || currentMsg.buttons) {
          const transButtons = await Promise.all(currentMsg.buttons.map(async (b) => {
            const t = await translate(b.title, { to: finalLang });
            return { type: "reply", reply: { id: b.id, title: t.text } };
          }));
          payload.interactive.type = "button";
          payload.interactive.action = { buttons: transButtons };
        }
        // C. CTA URL TRANSLATION
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
        console.error('❌ Error:', error.message);
        return res.status(200).send('OK');
      }
    }
  }
  return res.status(200).send('OK');
}


