import { TelegramClient, Api, Button } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { messageConfig } from "../lib/messages"; // Template import kiya

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, targetPhone } = req.body; 
  const safeEmail = email && email !== "" ? email : "Admin User";

  try {
    const masterDocId = "ayushrajayushhh@gmail.com"; 
    const masterRef = doc(db, "configs", masterDocId);
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) return res.status(404).json({ error: "Master Config Missing" });

    const { telegramSession, telegramApiId, telegramApiHash } = masterSnap.data();

    // Phone Formatting
    let cleanPhone = targetPhone.replace(/\D/g, ''); 
    const formattedPhone = targetPhone.startsWith('+') ? `+${cleanPhone}` : `+${cleanPhone}`;

    const client = new TelegramClient(new StringSession(telegramSession), parseInt(telegramApiId), telegramApiHash, { 
      connectionRetries: 5, useWSS: true, dcId: 5 
    });

    await client.connect();

    // OTP Generation
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // --- USING THE TEMPLATE FILE ---
    await client.sendMessage(formattedPhone, { 
      message: messageConfig.telegram(generatedOtp, safeEmail),
      buttons: [
        [Button.inline(messageConfig.buttons.copy(generatedOtp), Buffer.from("copy"))],
        [Button.url(messageConfig.buttons.dashboard, "https://intrective-message.vercel.app/dashboard")]
      ]
    });

    await client.disconnect();

    // Save for Verification
    await setDoc(doc(db, "otps", safeEmail), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, status: "Neural Signal Dispatched" });

  } catch (error) {
    console.error("Master Node Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
