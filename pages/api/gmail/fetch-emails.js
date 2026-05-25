import { google } from 'googleapis';
import { db } from '../../../firebase-admin';

export default async function handler(req, res) {
  const { userId } = req.query;

  try {
    const userDoc = await db.collection("configs").doc(userId).get();
    if (!userDoc.exists || !userDoc.data().gmail_refresh_token) {
      return res.status(404).json({ error: "Gmail not connected" });
    }

    const { gmail_refresh_token } = userDoc.data();
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: gmail_refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 1. List latest 10 messages
    const response = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
    const messages = response.data.messages || [];

    // 2. Fetch details for each message
    const emailData = await Promise.all(messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const headers = detail.data.payload.headers;
      
      return {
        id: msg.id,
        snippet: detail.data.snippet,
        subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
        from: headers.find(h => h.name === 'From')?.value || 'Unknown',
        date: headers.find(h => h.name === 'Date')?.value,
      };
    }));

    res.status(200).json(emailData);
  } catch (error) {
    console.error("Fetch Emails Error:", error);
    res.status(500).json({ error: error.message });
  }
}
