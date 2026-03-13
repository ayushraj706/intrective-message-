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
      let targetKey = null;

      try {
        // --- 1. PRIORITY: GEMINI MULTIMODAL AI (Photos/PDF/Text) ---
        // Build multimodal RAG with new Gemini Embedding.pdf]
        if (userStatus === "chatting_with_ai") {
          const aiModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: "You are a professional assistant for Ayush Raj's platforms: BaseKey, SuperKey, and LockerKey. Analyze text and media carefully. Be concise." 
          });

          let aiParts = [msg.text?.body || "फाइल का विश्लेषण करें।"];

          if (msg.type === "image" || msg.type === "document") {
            const mediaId = msg.image?.id || msg.document?.id;
            const mimeType = msg.image?.mime_type || msg.document?.mime_type;
            
            // Meta se media fetch
            const mediaRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
            });
            const fileData = await axios.get(mediaRes.data.url, {
              headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
              responseType: 'arraybuffer'
            });

            aiParts.push({ inlineData: { data: Buffer.from(fileData.data).toString("base64"), mimeType } });
          }

          const result = await aiModel.generateContent(aiParts);
          const transAi = await translate(result.response.text(), { to: userLang });

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, type: "interactive",
            interactive: {
              type: "button",
              body: { text: transAi.text.substring(0, 1024) },
              action: { buttons: [{ type: "reply", reply: { id: "main_menu", title: "🏠 Main Menu" } }] }
            }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          await updateDoc(userRef, { lastInteraction: Timestamp.now() });
          return res.status(200).send('OK'); 
        }

        // --- 2. INTERACTIVE & TEXT HANDLING ---
        if (msg.type === 'interactive') {
          const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
          if (replyId === "gemini_helper") {
            await setDoc(userRef, { status: "chatting_with_ai", lastInteraction: Timestamp.now() }, { merge: true });
            targetKey = "gemini_helper";
          } else if (replyId === "main_menu") {
            targetKey = "welcome";
            await updateDoc(userRef, { status: "normal" });
          } else { targetKey = replyId; }
        } else if (msg.type === 'text') {
          targetKey = "welcome"; // Fallback to welcome for any text
        }

        // --- 3. DYNAMIC JSON RESPONSE BUILDER ---
        if (targetKey) {
          let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
          
          // Fix for Meta 400 error: 'reply' ko 'button' mein map karna
          const apiType = (currentMsg.type === "reply" || currentMsg.type === "button") ? "button" : currentMsg.type;

          const transBody = await translate(currentMsg.body.replace("{{name}}", userName), { to: userLang });

          let payload = {
            messaging_product: "whatsapp", to: from, type: "interactive",
            interactive: { type: apiType, body: { text: transBody.text } }
          };

          if (apiType === "cta_url") {
            payload.interactive.action = { name: "cta_url", parameters: { display_text: currentMsg.button_text, url: currentMsg.url } };
          } else if (apiType === "button") {
            payload.interactive.action = { buttons: currentMsg.buttons.map(b => ({ type: "reply", reply: b })) };
          } else if (apiType === "list") {
            payload.interactive.action = { button: "विकल्प", sections: [{ title: "Select", rows: currentMsg.rows }] };
          }

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
          });
        }
      } catch (err) { console.error("Error in Handler:", err.message); }
    }
    return res.status(200).send('OK'); // Function end mein acknowledge karega
  }
}
