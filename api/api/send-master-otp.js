import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, targetPhone } = req.body; // Jisko OTP bhejna hai

  try {
    // 1. MASTER NODE DATA FETCH (ayushrajayushhh@gmail.com)
    // Hum hamesha is email wali config uthayenge chahe user koi bhi ho
    const masterDocId = "ayushrajayushhh@gmail.com"; 
    const masterRef = doc(db, "configs", masterDocId);
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      return res.status(404).json({ error: "Master Configuration Not Found in Firebase!" });
    }

    const { telegramSession, telegramApiId, telegramApiHash } = masterSnap.data();

    // 2. GENERATE RANDOM OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. TELEGRAM CLIENT INITIALIZATION (Using Master Credentials)
    const client = new TelegramClient(
      new StringSession(telegramSession), 
      parseInt(telegramApiId), 
      telegramApiHash, 
      { connectionRetries: 3 }
    );

    await client.connect();

    // 4. SEND OTP MESSAGE
    await client.sendMessage(targetPhone, { 
      message: `BaseKey Neural Link: Aapka login code ${generatedOtp} hai.\n\nGenerated for: ${email}` 
    });

    await client.disconnect();

    // 5. SAVE OTP FOR VERIFICATION
    // Ise 'otps' collection mein user ke email ke against save karenge
    await setDoc(doc(db, "otps", email), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: "OTP Transmitted via Master Node" });

  } catch (error) {
    console.error("Master Node Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

