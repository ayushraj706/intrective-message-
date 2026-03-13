import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = { /* तुम्हारी कॉन्फ़िगरेशन */ };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId, to, text } = req.body;

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { accessToken, phoneId } = configSnap.data();

    // नंबर से '+' हटाना अगर हो तो (Safe formatting)
    const cleanNumber = to.replace(/\D/g, ''); 

    const metaRes = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: cleanNumber,
        type: "text",
        text: { body: text }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    // यही वो लाइन है जो 400 एरर का राज खोलेगी
    const metaError = error.response?.data?.error?.message || error.message;
    console.error("META SHOUTING:", metaError);
    
    return res.status(400).json({ 
      error: "Meta rejected this!", 
      reason: metaError // अब ये अलर्ट में दिखेगा
    });
  }
}
