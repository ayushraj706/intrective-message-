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
        // --- 1. PRIORITY: GEMINI MULTIMODAL AI (Photo/PDF/Text Support) ---
        // Build multimodal RAG with new Gemini Embedding.pdf]
        if (userStatus === "chatting_with_ai" && (msg.type === "text" || msg.type === "image" || msg.type === "document")) {
          const aiModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: "You are a professional assistant for Ayush Raj's platforms: BaseKey, SuperKey, and LockerKey. Analyze media carefully and be concise." 
          });

          let aiParts = [msg.text?.body || "Please analyze this file."];

          if (msg.type === "image" || msg.type === "document") {
            const mediaId = msg.image?.id || msg.document?.id;
            const mimeType = msg.image?.mime_type || msg.document?.mime_type;
            
            // Meta API से मीडिया का URL प्राप्त करना
            const mediaRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
              headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
            });
            // फाइल डाउनलोड करना
            const fileBuffer = await axios.get(mediaRes.data.url, {
              headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
              responseType: 'arraybuffer'
            });

            aiParts.push({
              inlineData: { data: Buffer.from(fileBuffer.data).toString("base64"), mimeType }
            });
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
          return res.status(200).send('OK'); // AI रिप्लाई के बाद फंक्शन समाप्त
        }

        // --- 2. INTERACTIVE HANDLING ---
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
          targetKey = "welcome"; 
        }

        // --- 3. DYNAMIC RESPONSE BUILDER (Fixing 400 Error) ---
        if (targetKey) {
          const dbJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const currentMsg = dbJson[targetKey] || dbJson["welcome"];

          // ERROR FIX: 'reply' टाइप को 'button' में बदलना ताकि WhatsApp 400 एरर न दे
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
            payload.interactive.action = { button: "विकल्प", sections: [{ title: "Menu", rows: currentMsg.rows }] };
          }

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, payload, {
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
          });
        }
      } catch (err) {
        console.error("Handler Logic Error:", err.message);
      }
    }
    // Vercel termination फिक्स: res.send को सबसे अंत में रखा गया है
    return res.status(200).send('OK');
  }
}
