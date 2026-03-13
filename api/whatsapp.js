import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

      const userRef = doc(db, "users", from);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : { lang: 'hi', status: 'normal' };
      
      let userLang = userData.lang || "hi";
      let userStatus = userData.status || "normal";
      let lastTime = userData.lastInteraction ? userData.lastInteraction.toMillis() : Date.now();
      let currentTime = Date.now();
      let targetKey = null;

      // 1. TIMEOUT LOGIC (5 Mins)
      if (userStatus === "chatting_with_ai" && (currentTime - lastTime) > 300000) {
        userStatus = "normal";
        await updateDoc(userRef, { status: "normal" });
      }

      [span_0](start_span)[span_1](start_span)// 2. GEMINI AI MODE (Text + Photos + PDF)[span_0](end_span)[span_1](end_span)
      if (userStatus === "chatting_with_ai" && (msg.type === "text" || msg.type === "image" || msg.type === "document")) {
        try {
          const aiModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: "You are an assistant for Ayush Raj's BaseKey and SuperKey. Be concise and help with documents." 
          });

          let aiParts = [msg.text?.body || "Analyze this file."];
          if (msg.type === "image" || msg.type === "document") {
            const mediaId = msg.image?.id || msg.document?.id;
            const mimeType = msg.image?.mime_type || msg.document?.mime_type;
            const mediaRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
            const fileData = await axios.get(mediaRes.data.url, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }, responseType: 'arraybuffer' });
            aiParts.push({ inlineData: { data: Buffer.from(fileData.data).toString("base64"), mimeType } });
          }

          const result = await aiModel.generateContent(aiParts);
          const transAi = await translate(result.response.text(), { to: userLang });
          let replyText = transAi.text.substring(0, 1000);

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, type: "interactive",
            interactive: { type: "button", body: { text: replyText }, action: { buttons: [{ type: "reply", reply: { id: "main_menu", title: "🏠 Main Menu" } }] } }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          await updateDoc(userRef, { lastInteraction: Timestamp.now() });
          return res.status(200).send('OK');
        } catch (e) { return res.status(200).send('OK'); }
      }

      // 3. INTERACTIVE MESSAGE HANDLING (IDs logic)
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId.startsWith("lang_")) {
          const lCode = replyId.split("_")[1];
          if (!["1", "2", "3"].includes(lCode)) {
            await updateDoc(userRef, { lang: lCode });
            userLang = lCode; targetKey = "welcome";
          } else { targetKey = replyId; }
        } else if (replyId === "gemini_helper") {
          await setDoc(userRef, { status: "chatting_with_ai", lastInteraction: Timestamp.now() }, { merge: true });
          targetKey = "gemini_helper";
        } else if (replyId === "main_menu") {
          targetKey = "welcome"; await updateDoc(userRef, { status: "normal", lastInteraction: Timestamp.now() });
        } else {
          targetKey = replyId; 
        }
      }

      // 4. FINAL RESPONSE (JSON Data handling)
      if (targetKey || (userStatus === "normal" && !targetKey)) {
        if (!targetKey) targetKey = "welcome";
        let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
        const transBody = await translate(currentMsg.body.replace("{{name}}", userName), { to: userLang });

        let payload = {
          messaging_product: "whatsapp", to: from, type: "interactive",
          interactive: { type: currentMsg.type, body: { text: transBody.text } }
        };

        if (currentMsg.type === "cta_url") {
          payload.interactive.action = { name: "cta_url", parameters: { display_text: currentMsg.button_text, url: currentMsg.url } };
        } else if (currentMsg.type === "button" || currentMsg.type === "reply") {
          payload.interactive.action = { buttons: currentMsg.buttons.map(b => ({ type: "reply", reply: b })) };
        } else if (currentMsg.type === "list") {
          payload.interactive.action = { button: "विकल्प", sections: [{ title: "Menu", rows: currentMsg.rows }] };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });
      }
    }
  }
  return res.status(200).send('OK');
}
