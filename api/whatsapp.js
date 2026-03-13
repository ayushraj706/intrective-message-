import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import translate from 'google-translate-api-x';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Firebase Configuration
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
  
  // 1. Webhook Verification
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

      // 2. TIMEOUT LOGIC (5 Mins)
      if (userStatus === "chatting_with_ai" && (currentTime - lastTime) > 300000) {
        userStatus = "normal";
        await updateDoc(userRef, { status: "normal" });
      }

      // 3. STRONG GEMINI MODE (Gemini-1.5-Flash)
      if (msg.type === "text" && userStatus === "chatting_with_ai") {
        try {
          const aiModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: "You are an assistant for Ayush Raj's platforms: BaseKey, SuperKey, and LockerKey. Be concise (under 800 chars)." 
          });

          const result = await aiModel.generateContent(msg.text.body);
          const aiText = result.response.text();
          const transAi = await translate(aiText, { to: userLang });
          let finalReply = transAi.text;

          if (finalReply.length > 1000) finalReply = finalReply.substring(0, 997) + "...";

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", recipient_type: "individual", to: from, type: "interactive",
            interactive: {
              type: "button",
              body: { text: finalReply },
              action: { buttons: [{ type: "reply", reply: { id: "main_menu", title: "🏠 Main Menu" } }] }
            }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          await updateDoc(userRef, { lastInteraction: Timestamp.now() });
          return res.status(200).send('OK');
        } catch (e) { return res.status(200).send('OK'); }
      }

      // 4. STRONG INTERACTIVE HANDLING (Language + Menu)
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        // Handling Language Selection
        if (replyId.startsWith("lang_")) {
          const langCode = replyId.split("_")[1];
          // Check if it's a real language or just a menu page
          if (!["1", "2", "3"].includes(langCode)) {
            await updateDoc(userRef, { lang: langCode });
            userLang = langCode;
            targetKey = "welcome"; // Go to welcome menu after language change
          } else {
            targetKey = replyId; // Just change the menu page
          }
        } 
        else if (replyId === "gemini_helper") {
          await setDoc(userRef, { status: "chatting_with_ai", lastInteraction: Timestamp.now() }, { merge: true });
          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, text: { body: "नमस्ते! अब आप AI से बात कर सकते हैं।" }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
          return res.status(200).send('OK');
        } 
        else if (replyId === "main_menu") {
          targetKey = "welcome"; 
          await updateDoc(userRef, { status: "normal", lastInteraction: Timestamp.now() });
        } else {
          targetKey = replyId; 
        }
      }

      // 5. FINAL RESPONSE BUILDER (CTA URL + List + Buttons)
      if (targetKey || (userStatus === "normal" && !targetKey)) {
        if (!targetKey) targetKey = "welcome";
        let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
        
        const transBody = await translate(currentMsg.body.replace("{{name}}", userName), { to: userLang });

        let payload = {
          messaging_product: "whatsapp", to: from, type: "interactive",
          interactive: { type: currentMsg.type, body: { text: transBody.text } }
        };

        // Adding Specific Logic for CTA_URL
        if (currentMsg.type === "cta_url") {
          payload.interactive.action = {
            name: "cta_url",
            parameters: { display_text: currentMsg.button_text, url: currentMsg.url }
          };
        } 
        else if (currentMsg.type === "button" || currentMsg.type === "reply") {
          payload.interactive.action = { buttons: currentMsg.buttons.map(b => ({ type: "reply", reply: b })) };
        } 
        else if (currentMsg.type === "list") {
          payload.interactive.action = { button: "Options", sections: [{ title: "Select", rows: currentMsg.rows }] };
        }

        await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });
      }
    }
  }
  return res.status(200).send('OK');
              }

