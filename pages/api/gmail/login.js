import { google } from 'googleapis';

export default async function handler(req, res) {
  const { userId } = req.query; // Dashboard se hum userId bhejenge

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: userId, // <--- Ye Google ko batayega ki kaunsa user login kar raha hai
    scope: ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/userinfo.email'],
  });

  res.redirect(url);
}
