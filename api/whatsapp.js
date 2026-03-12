import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import translate from 'google-translate-api-x';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "You are an assistant for Ayush Raj's platforms: BaseKey (WhatsApp Business API) and SuperKey (IT & Govt Tenders). Also help with Sanskrit grammar using Panini rules. Keep responses concise."
});

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    if (token === 'Ayush@7859032663') return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";
      const incoming_phone_id = value.metadata.phone_number_id; 

      // 1. Database se User Data (Language aur Status) nikaalein
      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : { lang: null, status: "normal" };
      let userLang = userData.lang;
      let userStatus = userData.status || "normal";

      let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      let targetKey = null; // Default null rakhein

      // 2. Interactive Message (Buttons/List) Handling
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId === "gemini_helper") {
          userStatus = "chatting_with_ai";
          await setDoc(userRef, { status: userStatus }, { merge: true });
          targetKey = "gemini_helper";
        } else if (replyId === "main_menu") {
          userStatus = "normal";
          await setDoc(userRef, { status: userStatus }, { merge: true });
          targetKey = "main_menu";
        } else if (replyId && replyId.startsWith("lang_") && !["lang_1", "lang_2", "lang_3"].includes(replyId)) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang, name: userName, status: "normal" }, { merge: true });
          targetKey = "welcome";
        } else {
          targetKey = replyId;
          // Kisi bhi aur button par AI mode band kar dein
          if (userStatus !== "normal") {
            await setDoc(userRef, { status: "normal" }, { merge: true });
            userStatus = "normal";
          }
        }
      }

      // 3. AI Mode Priority: Agar user AI mode mein hai aur text bhej raha hai
      if (userStatus === "chatting_with_ai" && msg.type === "text" && !targetKey) {
        try {
          const result = await aiModel.generateContent(msg.text.body);
          const aiReply = result.response.text();
          const transAi = await translate(aiReply, { to: userLang || "hi" });

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: transAi.text }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          return res.status(200).send('OK');
        } catch (e) {
          console.error("Gemini Error:", e.message);
        }
      }

      // 4. Fallback Logic: Agar AI mode nahi hai, toh menu dikhayein
      if (!targetKey) {
        targetKey = userLang ? "welcome" : "lang_1";
      }

      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      const rawBody = currentMsg.body.replace("{{name}}", userName);
      const finalLang = userLang || "hi";

      try {
        const transBody = await translate(rawBody, { to: finalLang });
        let payload = {
          messaging_product: "whatsapp", to: from, type: "interactive",
          interactive: { body: { text: transBody.text } }
        };

        // List/Button Payload Logic (Same as your original)
        if (currentMsg.type === "list") {
          const transRows = await Promise.all(currentMsg.rows.map(async (row) => {
            if (targetKey.startsWith("lang_")) return row;
            const tTitle = await translate(row.title, { to: finalLang });
            return { id: row.id, title: tTitle.text, description: row.description };
          }));
          payload.interactive.type = "list";
          payload.interactive.action = { button: "Options", sections: [{ title: "Menu", rows: transRows }] };
        } else if (currentMsg.type === "reply" || currentMsg.buttons) {
          const transButtons = await Promise.all(currentMsg.buttons.map(async (b) => {
            const t = await translate(b.title, { to: finalLang });
            return { type: "reply", reply: { id: b.id, title: t.text } };
          }));
          payload.interactive.type = "button";
          payload.interactive.action = { buttons: transButtons };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });
      } catch (error) {
        console.error("Final Error:", error.message);
      }
    }
  }
  return res.status(200).send('OK');
}
