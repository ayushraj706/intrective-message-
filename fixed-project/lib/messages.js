export const messageConfig = {
  // Telegram Template (Pichhla wala)
  telegram: (otp, email) => `**BaseKey Neural Auth** 🛡️\n\nCode: \`${otp}\` \n\nFor: ${email}`,

  // --- NEW: EMAIL HTML TEMPLATE ---
  emailHTML: (otp) => `
    <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
      <h1 style="color: #3b82f6; font-style: italic;">BaseKey <span style="color: #fff;">Neural Link</span></h1>
      <p style="color: #a1a1aa; letter-spacing: 2px; font-size: 10px; text-transform: uppercase;">Secure Admin Access</p>
      <div style="margin: 30px 0; padding: 20px; border: 1px solid #27272a; border-radius: 15px; text-align: center;">
        <p style="color: #71717a; font-size: 12px;">Verification Code:</p>
        <h2 style="font-size: 32px; letter-spacing: 10px; color: #fff; margin: 10px 0;">${otp}</h2>
      </div>
      <p style="color: #52525b; font-size: 10px;">If you didn't request this, ignore this email.</p>
    </div>
  `
};
