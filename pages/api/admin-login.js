export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST allow hai' });

  const { email, password } = req.body;

  // Environment variables se match karo
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true, message: 'Welcome Ayush!' });
  } else {
    return res.status(401).json({ success: false, error: 'Email ya Password galat hai!' });
  }
}
