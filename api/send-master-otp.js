import { Resend } from 'resend';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { messageConfig } from "../../lib/messages"; // Path check kar lena

const resend = new Resend(process.env.RESEND_API_KEY);

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

// Initialize Firebase (Check if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  try {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Send via Resend
    await resend.emails.send({
      from: 'BaseKey Security <onboarding@resend.dev>', // Apna domain ho toh wo daalein
      to: email,
      subject: '🛡️ BaseKey Neural Verification Code',
      html: messageConfig.emailHTML(generatedOtp),
    });

    // 2. Save for Verification
    // Hum "login_" prefix use karenge taaki 2FA se clash na ho
    await setDoc(doc(db, "otps", `login_${email}`), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
