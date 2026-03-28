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

  // Dashboard se email aur phone number lena
  const { email, targetPhone } = req.body; 

  // Neutral Fallback: Agar email undefined ho toh use block karne ke bajaye 'Admin' show karega
  const safeEmail = email && email !== "" ? email : "Admin User";

  try {
    // 1. MASTER NODE DATA FETCH (ayushrajayushhh@gmail.com)
    const masterDocId = "ayushrajayushhh@gmail.com"; 
    const masterRef = doc(db, "configs", masterDocId);
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) {
      return res.status(404).json({ error: "Master Configuration Not Found!" });
    }

    const { telegramSession, telegramApiId, telegramApiHash } = masterSnap.data();

    // 2. GLOBAL PHONE FORMATTING (Handle +91, +1 etc.)
    let cleanPhone = targetPhone.replace(/\D/g, ''); 
    const formattedPhone = targetPhone.startsWith('+') ? `+${cleanPhone}` : `+${cleanPhone}`;

    // 3. TELEGRAM CLIENT INITIALIZATION (Neural DC 5 Link)
    const client = new TelegramClient(
      new StringSession(telegramSession), 
      parseInt(telegramApiId), 
      telegramApiHash, 
      { 
        connectionRetries: 5, 
        useWSS: true, 
        dcId: 5 
      }
    );

    await client.connect();

    // 4. NEURAL SEARCH / CONTACT IMPORT (Entity Error Fix)
    try {
      await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Date.now()),
              phone: formattedPhone,
              firstName: "BaseKey",
              lastName: "User",
            }),
          ],
        })
      );
    } catch (importErr) {
      console.log("Contact import skipped or failed.");
    }

    // 5. GENERATE & SEND OTP WITH INTERACTIVE BUTTONS
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await client.sendMessage(formattedPhone, { 
      message: `**BaseKey Neural Auth** 🛡️\n\nYour secure login code is: \`${generatedOtp}\` \n\nGenerated for: **${safeEmail}**\n\n💡 _Tap the code above to copy instantly._`,
      buttons: [
        [
          // Professional Copy Button (Shows the code with a clipboard emoji)
          Button.inline(`📋 Copy Code: ${generatedOtp}`, Buffer.from("copy_clicked"))
        ],
        [
          // Direct Link to Dashboard
          Button.url("🌐 Open Dashboard", "https://intrective-message.vercel.app/dashboard")
        ]
      ]
    });

    await client.disconnect();

    // 6. SAVE OTP FOR VERIFICATION
    // Email ko as a key use karenge taaki verification endpoint ise pehchaan sake
    await setDoc(doc(db, "otps", safeEmail), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: "Signal Dispatched" });

  } catch (error) {
    console.error("Master Node Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
