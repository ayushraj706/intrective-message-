import { TelegramClient, Api, Button } from "telegram";
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

  const { email, targetPhone } = req.body; // Dashboard se aane wala data

  // Safety check: Agar email nahi aaya toh "User" likh do
  const userIdentifier = email && email !== "" ? email : "Authorized User";

  try {
    // 1. MASTER NODE DATA FETCH (Hamesha isi account se OTP jayega)
    const masterDocId = "ayushrajayushhh@gmail.com"; 
    const masterRef = doc(db, "configs", masterDocId);
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      return res.status(404).json({ error: "Master Configuration Not Found!" });
    }

    const { telegramSession, telegramApiId, telegramApiHash } = masterSnap.data();

    // 2. GLOBAL PHONE FORMATTING (+91, +1 handle karne ke liye)
    let cleanPhone = targetPhone.replace(/\D/g, ''); // Sirf numbers rakho
    if (!targetPhone.startsWith('+')) {
        cleanPhone = `+${cleanPhone}`;
    } else {
        cleanPhone = `+${cleanPhone}`;
    }

    // 3. TELEGRAM CLIENT INITIALIZATION
    const client = new TelegramClient(
      new StringSession(telegramSession), 
      parseInt(telegramApiId), 
      telegramApiHash, 
      { connectionRetries: 5, useWSS: true, dcId: 5 }
    );

    await client.connect();

    // 4. GENERATE OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. SEND INTERACTIVE MESSAGE
    // Note: Monospace text (backticks) automatic tap-to-copy trigger karta hai
    await client.sendMessage(cleanPhone, { 
      message: `**BaseKey Neural Auth** 🛡️\n\nYour secure code is: \`${generatedOtp}\` \n\nGenerated for: **${userIdentifier}**\n\n💡 _Tap the code above to copy instantly._`,
      buttons: [
        [
          // Interactive "Copy" Button (Text based)
          Button.inline(`📋 Copy: ${generatedOtp}`, Buffer.from("copy"))
        ],
        [
          // Dashboard link button
          Button.url("🌐 Open Dashboard", "https://intrective-message.vercel.app/dashboard")
        ]
      ]
    });

    await client.disconnect();

    // 6. SAVE OTP IN FIREBASE (Verification ke liye)
    // Hum user ke email ke against save karenge taaki login page match kar sake
    await setDoc(doc(db, "otps", userIdentifier), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: "OTP Dispatched via Master Node" });

  } catch (error) {
    console.error("Master Node Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
