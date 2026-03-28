// api/send.js
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  // Dashboard se 'uid' (ya email) aur message details aayenge
  const { uid, targetPhone, messageText } = req.body;

  try {
    // 1. Firebase se us specific user ka data nikalna
    const userRef = doc(db, "configs", uid); 
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Is user ka setup nahi mila!" });
    }

    const { telegramSession, telegramApiId, telegramApiHash } = userSnap.data();

    // 2. Client setup sirf is user ke session ke saath
    const client = new TelegramClient(
      new StringSession(telegramSession), 
      parseInt(telegramApiId), 
      telegramApiHash, 
      { connectionRetries: 3 }
    );

    await client.connect();
    await client.sendMessage(targetPhone, { message: messageText });
    await client.disconnect();

    return res.status(200).json({ success: true, status: "Message Transmitted" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

