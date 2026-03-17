import { google } from 'googleapis';
import { db } from '../../../../firebase-admin';

export default async function handler(req, res) {
  const { userId, toEmail, senderName, subject, aiResponse } = req.body;

  try {
    // 1. Firebase se Refresh Token nikalo
    const userDoc = await db.collection("configs").doc(userId).get();
    const { gmail_refresh_token } = userDoc.data();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: gmail_refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 2. HTML Template taiyar karo
    const htmlBody = generateHTMLReply(senderName, aiResponse);

    // 3. Raw Message Create karo (MIME format)
    const str = [
      `Content-Type: text/html; charset="UTF-8"\n`,
      `MIME-Version: 1.0\n`,
      `Content-Transfer-Encoding: 7bit\n`,
      `to: ${toEmail}\n`,
      `subject: Re: ${subject}\n\n`,
      htmlBody
    ].join('');

    const encodedMessage = Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Send karo!
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    res.status(200).json({ success: true, message: "Reply Sent Successfully!" });

  } catch (error) {
    console.error("🔥 Mail Send Error:", error);
    res.status(500).json({ error: error.message });
  }
}

