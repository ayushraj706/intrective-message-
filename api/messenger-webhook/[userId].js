import { db } from '../../lib/firebase-admin'; // Admin SDK ka use karke

export default async function handler(req, res) {
  const { userId } = req.query;

  // 1. Database se User ki configuration uthao
  const userConfigRef = db.collection('configs').doc(userId);
  const doc = await userConfigRef.get();

  if (!doc.exists) {
    return res.status(404).send('User not found in BaseKey');
  }

  const { meta_verify_token, meta_app_secret } = doc.data();

  // --- META VERIFICATION (GET Request) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Database wale token se match karo
    if (mode && token === meta_verify_token) {
      console.log(`Bhai, ${userId} ka webhook verify ho gaya!`);
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // --- INCOMING MESSAGES (POST Request) ---
  if (req.method === 'POST') {
    // Signature check bhi hum dynamic App Secret se kar sakte hain
    // ... signature logic ...

    const body = req.body;
    if (body.object === 'page') {
      // Message ko 'messages' collection mein user_id ke sath save karo
      console.log(`Naya message for ${userId}`);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}
