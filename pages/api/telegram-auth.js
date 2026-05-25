// File ka rasta: pages/api/telegram-auth.js

import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, apiId, apiHash, phoneNumber, phoneCodeHash, otp, tempSession } = req.body;

  if (!apiId || !apiHash || !phoneNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const stringSession = new StringSession(tempSession || ""); 
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    // --- LOGIC 1: OTP BHEJO ---
    if (action === 'sendCode') {
      const result = await client.sendCode({
        apiId,
        apiHash,
      }, phoneNumber);
      
      return res.status(200).json({
        success: true,
        phoneCodeHash: result.phoneCodeHash,
        tempSession: client.session.save() 
      });
    } 
    
    // --- LOGIC 2: OTP VERIFY KARO ---
    else if (action === 'verifyCode') {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: phoneCodeHash,
          phoneCode: otp,
        })
      );
      
      const sessionString = client.session.save();
      
      return res.status(200).json({
        success: true,
        sessionString: sessionString 
      });
    }

  } catch (error) {
    console.error("Telegram API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
