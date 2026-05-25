import { google } from 'googleapis';
import { db } from '../../../firebase-admin'; // Sirf 3 baar ../ kyunki ye file kam andar hai

export default async function handler(req, res) {
  const { userId, toEmail, senderName, subject, aiResponse, customHtml } = req.body;

  try {
    const userDoc = await db.collection("configs").doc(userId).get();
    const { gmail_refresh_token } = userDoc.data();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: gmail_refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // User ka custom HTML use karo, aur AI response ko replace karo
    // User apne template mein {{AI_REPLY}} likhega, hum usey replace kar denge
    const finalHtml = customHtml.replace('{{AI_REPLY}}', aiResponse);

    const str = [
      `Content-Type: text/html; charset="UTF-8"\n`,
      `MIME-Version: 1.0\n`,
      `Content-Transfer-Encoding: 7bit\n`,
      `to: ${toEmail}\n`,
      `subject: Re: ${subject}\n\n`,
      finalHtml
    ].join('');

    const encodedMessage = Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
