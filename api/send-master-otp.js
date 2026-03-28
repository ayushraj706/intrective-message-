import { Resend } from 'resend';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { messageConfig } from "../../lib/messages"; 

const resend = new Resend(process.env.RESEND_API_KEY);

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points"
};

// Neural Initialization: Crash hone se bachata hai
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, type } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();
  const storagePath = `${type || 'login'}_${cleanEmail}`;

  try {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Send via Resend
    // Note: onboarding@resend.dev sirf aapke verified email par mail bhejega
    const { data, error } = await resend.emails.send({
      from: 'BaseKey Security <onboarding@resend.dev>',
      to: cleanEmail,
      subject: '🛡️ BaseKey Neural Verification Code',
      html: messageConfig.emailHTML(generatedOtp),
    });

    if (error) throw new Error(error.message);

    // 2. Save for Verification with Prefix
    await setDoc(doc(db, "otps", storagePath), {
      code: generatedOtp,
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: "Email Sent Successfully" });

  } catch (error) {
    console.error("Resend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
