import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // Vercel wala URL yahan use hoga
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Isse Refresh Token milega
    prompt: 'consent',
    scope: scopes,
  });

  // User ko seedha Google login par bhej do
  res.redirect(url);
}
