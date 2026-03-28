import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, otp } = req.body;

  // NEURAL CHECK: Agar email khali hai toh yahi rok do
  if (!email || email === "" || email.includes("DETECTING")) {
    return res.status(400).json({ error: "Email ID nahi mili! Dashboard refresh karein." });
  }

  try {
    const otpRef = doc(db, "otps", email); // Ab ye crash nahi karega
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return res.status(404).json({ error: "OTP Expired ya galat hai!" });
    }

    const savedData = otpSnap.data();

    // OTP Match Check
    if (savedData.code === otp) {
      // OTP sahi hai! Security ke liye use delete kar do taaki dobara use na ho
      await deleteDoc(otpRef);
      return res.status(200).json({ success: true, message: "Identity Verified" });
    } else {
      return res.status(400).json({ error: "Galat OTP! Wapas check karein." });
    }

  } catch (error) {
    return res.status(500).json({ error: "Firebase Error: " + error.message });
  }
}

