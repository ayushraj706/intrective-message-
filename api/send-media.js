import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1",
  measurementId: "G-64DR1TSTKY"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, to, mediaUrl, mediaType } = req.body;

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { accessToken, phoneId } = configSnap.data();

    // Meta ko link dena
    await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ''),
      type: mediaType,
      [mediaType]: { link: mediaUrl }
    }, { headers: { Authorization: `Bearer ${accessToken}` } });

    // History save karna
    await addDoc(collection(db, "users", userId, "messages"), {
      text: mediaType === 'image' ? "📷 Photo" : "📄 File",
      mediaUrl, mediaType, sender: 'admin', senderNumber: to, timestamp: serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
