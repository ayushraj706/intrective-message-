import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

  try {
    // 1. MASTER NODE CONFIG FETCH
    const masterDocId = "ayushrajayushhh@gmail.com"; 
    const masterRef = doc(db, "configs", masterDocId);
    const masterSnap = await getDoc(masterRef);

    if (!masterSnap.exists()) return res.status(404).json({ error: "Master Node config missing!" });
    const { telegramSession, telegramApiId, telegramApiHash } = masterSnap.data();

    // 2. PHONE NUMBER CLEANING (Country Code Logic)
    // Spaces, dashes aur brackets hatao, aur check karo ki '+' hai ya nahi
    let cleanPhone = targetPhone.replace(/\D/g, ''); 
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
      { 
        connectionRetries: 5,
        useWSS: true, 
        dcId: 5 // Aapke logs ke mutabik DC 5 set kiya hai
      }
    );

    await client.connect();

    // 4. NEURAL SEARCH & IMPORT (Entity Error Fix)
    // Telegram ko batana padta hai ki ye number kiska hai message bhejne se pehle
    try {
      await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Math.floor(Math.random() * 1000000000)),
              phone: cleanPhone,
              firstName: "BaseKey User",
              lastName: email.split('@')[0], // Email ka pehla part name ki tarah
            }),
          ],
        })
      );
    } catch (searchErr) {
      console.log("Search/Import failed, trying direct send...");
    }

    // 5. GENERATE OTP & SEND
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await client.sendMessage(cleanPhone, { 
      message: `**BaseKey Neural Auth**\n\nYour login code is: \`${generatedOtp}\` \n\nGenerated for: ${email}\n(Tap code to copy)` 
    });

    await client.disconnect();

    // 6. SAVE OTP IN FIREBASE
    await setDoc(doc(db, "otps", email), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, status: "Signal Dispatched" });

  } catch (error) {
    console.error("Master Node Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
