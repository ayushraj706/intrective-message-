import { google } from 'googleapis';
import { db } from '../../../firebase-admin'; // Admin SDK use karein server par

export default async function handler(req, res) {
  const { code } = req.query;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // tokens.refresh_token ko Firebase mein 'users/userId/email_config' mein save karein
    // Refresh token milte hi aapka dashboard hamesha ke liye connect ho jayega
    
    console.log("✅ Gmail Connected Successfully!");
    res.redirect('/dashboard/inbox?status=success');
  } catch (error) {
    res.redirect('/dashboard/inbox?status=error');
  }
}

