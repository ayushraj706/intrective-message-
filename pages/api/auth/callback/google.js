import { google } from 'googleapis';
import { db } from '../../../../firebase-admin'; 

export default async function handler(req, res) {
  const { code, state } = req.query; // state mein userId hai

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const userId = state; 

    // Firebase mein tokens save karna
    await db.collection("configs").doc(userId).set({
      gmailConnected: true,
      gmail_refresh_token: tokens.refresh_token,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.redirect('/dashboard?gmail=success');
  } catch (error) {
    console.error("Gmail Link Error:", error);
    res.redirect('/dashboard?gmail=error');
  }
}

