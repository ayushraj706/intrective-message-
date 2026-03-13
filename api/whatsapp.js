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

async function getOldestStableModel() {
  try {
    const result = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const models = result.data.models;
    const stableModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    return stableModels[0].name.split('/').pop() || "gemini-1.0-pro";
  } catch (error) { return "gemini-1.0-pro"; }
}

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
      const userData = userSnap.exists() ? userSnap.data() : { lang: 'hi', status: 'normal', lastInteraction: Timestamp.now() };
      
      let userLang = userData.lang || "hi";
      let userStatus = userData.status || "normal";
      let lastTime = userData.lastInteraction ? userData.lastInteraction.toMillis() : Date.now();
      let currentTime = Date.now();
      let targetKey = null;

      // 1. TIMEOUT LOGIC
      if (userStatus === "chatting_with_ai" && (currentTime - lastTime) > 300000) {
        userStatus = "normal";
        await updateDoc(userRef, { status: "normal" });
      }

      // 2. GEMINI MODE WITH QUICK REPLY
      if (msg.type === "text" && userStatus === "chatting_with_ai") {
        try {
          const modelName = await getOldestStableModel();
          const aiModel = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: "You are an assistant for Ayush Raj's platforms: BaseKey, SuperKey, and LockerKey. Be very concise." 
          });

          const result = await aiModel.generateContent(msg.text.body);
          let aiText = result.response.text();
          const transAi = await translate(aiText, { to: userLang });
          let finalReply = transAi.text;

          if (finalReply.length > 1000) finalReply = finalReply.substring(0, 997) + "...";

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", recipient_type: "individual", to: from, type: "interactive",
            interactive: {
              type: "button", body: { text: finalReply },
              action: { buttons: [{ type: "reply", reply: { id: "main_menu", title: "🏠 Main Menu" } }] }
            }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          await updateDoc(userRef, { lastInteraction: Timestamp.now() });
          return res.status(200).send('OK');
        } catch (e) { return res.status(200).send('OK'); }
      }

      // 3. INTERACTIVE MESSAGE HANDLING
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId === "gemini_helper") {
          await setDoc(userRef, { status: "chatting_with_ai", lastInteraction: Timestamp.now() }, { merge: true });
          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, text: { body: "नमस्ते! अब आप AI से बात कर सकते हैं।" }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
          return res.status(200).send('OK');
        } 
        
        // FIX: targetKey set karna zaroori hai
        if (replyId === "main_menu") {
          targetKey = "welcome"; 
          await updateDoc(userRef, { status: "normal", lastInteraction: Timestamp.now() });
        } else {
          targetKey = replyId; 
        }
      }

      // 4. FALLBACK TO WELCOME MENU
      if (!targetKey && userStatus === "normal") targetKey = "welcome";

      // 5. SENDING FINAL RESPONSE FROM JSON
      if (targetKey) {
        let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
        
        // Translation logic for body
        const transBody = await translate(currentMsg.body.replace("{{name}}", userName), { to: userLang });

        let payload = {
          messaging_product: "whatsapp", to: from, type: "interactive",
          interactive: {
            type: currentMsg.type,
            body: { text: transBody.text }
          }
        };

        // Adding Buttons or Lists
        if (currentMsg.type === "button") {
          payload.interactive.action = { buttons: currentMsg.buttons.map(b => ({ type: "reply", reply: b })) };
        } else if (currentMsg.type === "list") {
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
