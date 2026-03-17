import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = { /* Aapka Config */ };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
      const userRef = doc(db, "configs", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedToken = userSnap.data().fbVerifyToken;
        
        if (mode === 'subscribe' && token === storedToken) {
          await updateDoc(userRef, { isFbVerified: true });
          // ZAROORI: Sirf challenge return karo bina kisi JSON ke
          return res.status(200).send(challenge);
        }
      }
      return res.status(403).send('Verification Failed');
    } catch (error) { return res.status(500).send('Server Error'); }
  }
  // POST Logic (Message saving) yahan aayega...
}
