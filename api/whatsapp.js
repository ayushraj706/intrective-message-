import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import translate from 'google-translate-api-x'; // Auto-translation tool

// Firebase Config
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
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";

      // 1. Firebase se Language fetch karein
      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userLang = userSnap.exists() ? userSnap.data().lang : "hi"; // Default Hindi

      let targetKey = "welcome";

      // 2. Button/List Clicks
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId.startsWith("lang_") && !["lang_1", "lang_2", "lang_3"].includes(replyId)) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang }, { merge: true });
          targetKey = "welcome"; 
        } else {
          targetKey = replyId;
        }
      }

      // Agar bhasha nahi chuni, toh selection dikhayein
      if (!userSnap.exists() && !targetKey.startsWith("lang_")) {
        targetKey = "lang_1";
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const rawBody = currentMsg.body.replace("{{name}}", userName);

      try {
        // 🔥 MAGIC: Google Translate Body aur Buttons ko userLang mein badal dega
        const translatedBody = await translate(rawBody, { to: userLang });
        
        let payload = {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: {
            body: { text: translatedBody.text }
          }
        };

        // Buttons ko bhi translate karein
        if (currentMsg.buttons) {
          const transButtons = await Promise.all(currentMsg.buttons.map(async (b) => {
            const t = await translate(b.title, { to: userLang });
            return { type: "reply", reply: { id: b.id, title: t.text } };
          }));
          payload.interactive.type = "button";
          payload.interactive.action = { buttons: transButtons };
        } else if (currentMsg.type === "list") {
          // List translation logic yahan aayega...
        }

        await axios.post(`https://graph.facebook.com/v18.0/${REAL_PHONE_ID}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });

        return res.status(200).send('OK');
      } catch (error) {
        console.error('❌ Translation/API Error:', error.message);
        return res.status(200).send('OK'); // Error par bhi OK bhejien taaki Meta repeat na kare
      }
    }
  }
  return res.status(200).send('OK');
}
