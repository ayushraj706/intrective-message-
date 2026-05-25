import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body;

  try {
    // Businessman ki API ko test karna
    const test = await axios.get(url, { timeout: 5000 });
    
    // Agar status 200 hai matlab system connected hai
    if (test.status === 200) {
      return res.status(200).json({ success: true, message: "Connected" });
    }
    throw new Error("Invalid Response");
  } catch (error) {
    return res.status(400).json({ success: false, error: "Connection Failed" });
  }
}

