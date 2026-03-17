import { db } from '../../lib/firebase-admin'; // Admin SDK configuration
import crypto from 'crypto';

export default async function handler(req, res) {
  const { userId } = req.query;

  // 1. DATABASE LOOKUP: User ki dynamic config uthao
  const userConfigRef = db.collection('configs').doc(userId);
  const doc = await userConfigRef.get();

  if (!doc.exists) {
    console.error(`Bhai, ${userId} ka data Firestore mein nahi mila!`);
    return res.status(404).send('User not found');
  }

  const { insta_verify_token, meta_app_secret } = doc.data();

  // --- STEP A: INSTAGRAM VERIFICATION (GET Request) ---
  // Meta jab "Verify" button dabane par handshake karega
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === insta_verify_token) {
      console.log(`Instagram Node Verified for User: ${userId} ✅`);
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // --- STEP B: INCOMING DMs & COMMENTS (POST Request) ---
  if (req.method === 'POST') {
    // Security: Signature check (Must for Production)
    const signature = req.headers['x-hub-signature-256'];
    
    if (meta_app_secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', meta_app_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        return res.status(401).send('Invalid Signature');
      }
    }

    const body = req.body;

    if (body.object === 'instagram') {
      body.entry.forEach(entry => {
        // Instagram messaging events handle karo
        const messagingEvent = entry.messaging ? entry.messaging[0] : null;
        
        if (messagingEvent) {
          const senderId = messagingEvent.sender.id;
          const messageText = messagingEvent.message?.text;

          console.log(`Bhai, Instagram DM aaya: "${messageText}" from ${senderId}`);

          // TODO: Is data ko 'instagram_inbox' collection mein push karo
        }
      });
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).end();
  }
}

