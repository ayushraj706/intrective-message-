import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCCqWVSgULjZtgfOqVX3CBmOonxkr2UB7g",
  authDomain: "whatsapp-950a8.firebaseapp.com",
  projectId: "whatsapp-950a8",
  storageBucket: "whatsapp-950a8.firebasestorage.app",
  messagingSenderId: "526342181957",
  appId: "1:526342181957:web:0e71810f3ccbb297413f2c",
  measurementId: "G-M0336296QN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

      // --- Firebase se User ki Bhasha check karein ---
      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userLang = userSnap.exists() ? userSnap.data().lang : null;

      let targetKey = "welcome";

      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        // Agar bhasha chuni gayi hai, toh usey Firebase mein save karein
        if (replyId.startsWith("lang_")) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang, name: userName }, { merge: true });
          targetKey = "welcome"; // Bhasha chunne ke baad Welcome par bhejien
        } else {
          targetKey = replyId;
        }
      }

      // Agar bhasha set nahi hai, toh selection dikhayein
      if (!userLang && targetKey !== "lang_2" && targetKey !== "lang_3") {
        targetKey = "lang_1";
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const finalBody = currentMsg.body.replace("{{name}}", userName);
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      try {
        let payload = { messaging_product: "whatsapp", to: from };

        if (currentMsg.type === "list") {
          payload.type = "interactive";
          payload.interactive = {
            type: "list",
            body: { text: finalBody },
            action: { button: "Options", sections: [{ title: "Choose", rows: currentMsg.rows }] }
          };
        } else if (currentMsg.type === "cta_url") {
          payload.type = "interactive";
          payload.interactive = {
            type: "cta_url",
            body: { text: finalBody },
            action: { name: "cta_url", parameters: { display_text: currentMsg.button_text, url: currentMsg.url } }
          };
        } else {
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
