import { google } from 'googleapis';
import { db } from '../../../../firebase-admin'; // 4 levels back to reach root

export default async function handler(req, res) {
  const { code } = req.query;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // TODO: Yahan dynamic userId nikalna hoga (Sessions ya State se)
    // Abhi ke liye hum aapki fixed ID use kar rahe hain testing ke liye
    const userId = "ayush_raj_id"; 

    // Firebase mein tokens aur status save karna
    await db.collection("configs").doc(userId).set({
      gmailConnected: true,
      gmail_refresh_token: tokens.refresh_token,
      gmail_email: "connected_user@gmail.com", // Baad mein oauth2Client.getToken se nikal sakte hain
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log("✅ Gmail Linked Successfully");
    res.redirect('/dashboard?gmail=success');

  } catch (error) {
    console.error("🔥 Google Auth Error:", error);
    res.redirect('/dashboard?gmail=error');
  }
}
