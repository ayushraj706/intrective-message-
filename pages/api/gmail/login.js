import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default async function handler(req, res) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify', // Mail padhne aur read/unread karne ke liye
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Sabse zaruri: Isse humein Refresh Token milega
    prompt: 'consent',      // Har baar consent maangega taaki refresh token miss na ho
    scope: scopes,
  });

  res.redirect(url);
}

