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

// 1. Dynamic Model Selector Function
async function getOldestStableModel() {
  try {
    // Ye function Gemini se available models ki list mangega
    const result = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const models = result.data.models;
    
    // Stable aur purane models (jaise gemini-1.0-pro) ko filter karna
    const stableModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    // Sabse purana model aksar list ke shuruat mein hota hai (Jaise Gemini 1.0 Pro)
    return stableModels[0].name.split('/').pop() || "gemini-1.0-pro";
  } catch (error) {
    console.error("Model List Error:", error.message);
    return "gemini-1.0-pro"; // Fallback agar API list na de paye
  }
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
      
      let messagesDB = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      let targetKey = null;

      // --- 2. 5-MINUTE TIMEOUT LOGIC ---
      // Agar user AI mode mein hai aur 5 mins (300,000 ms) se zyada ho gaye hain
      if (userStatus === "chatting_with_ai" && (currentTime - lastTime) > 300000) {
        userStatus = "normal";
        await updateDoc(userRef, { status: "normal" });
        // User ko batana ki timeout ho gaya hai
        await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
          messaging_product: "whatsapp", to: from, type: "text",
          text: { body: "⏱️ आप 5 मिनट से निष्क्रिय थे, इसलिए आपको मुख्य मेनू पर वापस भेज दिया गया है।" }
        }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
      }

      // --- 3. PRIORITY: AI MODE ---
      if (msg.type === "text" && userStatus === "chatting_with_ai") {
        try {
          const modelName = await getOldestStableModel();
          const aiModel = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: "You are an assistant for Ayush Raj's platforms: BaseKey, SuperKey, and LockerKey. Also help with Sanskrit grammar. Be concise." 
          });

          const result = await aiModel.generateContent(msg.text.body);
          const aiText = result.response.text();
          const transAi = await translate(aiText, { to: userLang });

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, type: "text",
            text: { body: transAi.text }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });

          // Update last interaction time
          await updateDoc(userRef, { lastInteraction: Timestamp.now() });
          return res.status(200).send('OK');
        } catch (e) {
          return res.status(200).send('OK');
        }
      }

      // --- 4. HANDLE BUTTONS ---
      if (msg.type === 'interactive') {
        const replyId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        
        if (replyId === "gemini_helper") {
          userStatus = "chatting_with_ai";
          // User ko warning dena session limits ke baare mein
          const warningMsg = "नमस्ते! आप जेमिनी एआई (Gemini AI) से जुड़ चुके हैं।\n\n⚠️ *ध्यान दें:* यदि आप 5 मिनट तक कोई उत्तर नहीं देंगे, तो आप स्वचालित रूप से मुख्य मेनू पर वापस चले जाएंगे।\n\nअब आप अपना प्रश्न पूछ सकते हैं:";
          const transWarning = await translate(warningMsg, { to: userLang });
          
          await setDoc(userRef, { 
            status: "chatting_with_ai", 
            lastInteraction: Timestamp.now() 
          }, { merge: true });

          await axios.post(`https://graph.facebook.com/v18.0/${incoming_phone_id}/messages`, {
            messaging_product: "whatsapp", to: from, type: "text",
            text: { body: transWarning.text }
          }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
          
          return res.status(200).send('OK');
        } else {
          targetKey = replyId;
          await setDoc(userRef, { status: "normal", lastInteraction: Timestamp.now() }, { merge: true });
        }
      }

      // --- 5. MENU FALLBACK ---
      if (!targetKey) targetKey = userLang ? "welcome" : "lang_1";
      const currentMsg = messagesDB[targetKey] || messagesDB["welcome"];
      // ... (Rest of your translation and payload logic)
    }
  }
  return res.status(200).send('OK');
}
