import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import translate from 'google-translate-api-x';
import { GoogleGenerativeAI } from "@google/generative-ai"; // 1. Gemini Import

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

// 2. Gemini Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
const aiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "You are an assistant for Ayush Raj's platforms: BaseKey (WhatsApp Business API) and SuperKey (IT & Govt Tenders). Help users with their queries about these services. Keep responses concise."
});

export default async function handler(req, res) {
  const jsonPath = path.join(process.cwd(), 'interactive-message.json');
  
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'Ayush@7859032663') {
      return res.status(200).send(challenge); 
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    if (value && value.messages) {
      const msg = value.messages[0];
      const from = msg.from;
      const userName = value.contacts?.[0]?.profile?.name || "User";
      const incoming_phone_id = value.metadata.phone_number_id; 

      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      let userData = userSnap.exists() ? userSnap.data() : { lang: "hi", status: "normal" };
      let userLang = userData.lang;
      let userStatus = userData.status;

      let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      let targetKey = null;

      // --- 3. INTERACTIVE HANDLING (Buttons/Lists) ---
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId === "gemini_helper") {
          await updateDoc(userRef, { status: "chatting_with_ai" });
          userStatus = "chatting_with_ai";
          targetKey = "gemini_helper";
        } else if (replyId === "main_menu") {
          await updateDoc(userRef, { status: "normal" });
          userStatus = "normal";
          targetKey = "main_menu";
        } else if (replyId && replyId.startsWith("lang_") && !["lang_1", "lang_2", "lang_3"].includes(replyId)) {
          userLang = replyId.split("_")[1];
          await setDoc(userRef, { lang: userLang, name: userName }, { merge: true });
          targetKey = "welcome";
        } else {
          targetKey = replyId;
        }
      }

      // --- 4. AI MODE LOGIC ---
      if (userStatus === "chatting_with_ai" && msg.type === "text" && !targetKey) {
        try {
          const result = await aiModel.generateContent(msg.text.body);
          const aiText = result.response.text();
          const transAiText = await translate(aiText, { to: userLang });

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: transAiText.text }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          return res.status(200).send('OK');
        } catch (e) {
          console.error("AI Error:", e.message);
        }
      }

      // --- 5. NORMAL MENU LOGIC ---
      if (!targetKey && !userLang) targetKey = "lang_1";
      if (!targetKey) targetKey = "welcome";

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

        // ... (Baaki translation aur payload logic jo tumhare code mein tha wahi rahega)
        // Buttons aur List wala logic yahan continue hoga...
        
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

        await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });

        return res.status(200).send('OK');
      } catch (error) {
        return res.status(200).send('OK');
      }
    }
  }
  return res.status(200).send('OK');
}

