// Is file ko aap jab chahe edit kar sakte ho
export const messageConfig = {
  // Telegram Message Template
  telegram: (otp, email) => {
    return `**BaseKey Neural Auth** 🛡️\n\n` +
           `Your secure login code is: \`${otp}\` \n\n` +
           `Generated for: **${email}**\n\n` +
           `💡 _Tap the code above to copy instantly._`;
  },

  // Telegram Button Texts
  buttons: {
    copy: (otp) => `📋 Copy Code: ${otp}`,
    dashboard: "🌐 Open Dashboard"
  },

  // Email Template (Future use ke liye)
  email: (otp) => {
    return `Aapka BaseKey verification code ${otp} hai.`;
  }
};

