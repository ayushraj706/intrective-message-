import { google } from 'googleapis';
import { db } from '../../../firebase-admin'; // Aapka admin setup

export default async function handler(req, res) {
  const { code, state } = req.query; // 'state' mein aap userId bhej sakte ho

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Refresh Token mil gaya! Ise Firebase mein save karo.
    // Dhayan rakhna: userId aapko session ya state se nikalni hogi.
    const userId = "ayush_raj_id"; // Sample ID, ise dynamic banana hoga

    await db.collection("users").doc(userId).collection("configs").doc("gmail").set({
      refresh_token: tokens.refresh_token,
      email: "connected_user@gmail.com",
      status: 'active',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Login success hone ke baad dashboard par wapas bhejo
    res.redirect('/dashboard?gmail=success');

  } catch (error) {
    console.error("🔥 Google Auth Error:", error);
    res.redirect('/dashboard?gmail=error');
  }
}
