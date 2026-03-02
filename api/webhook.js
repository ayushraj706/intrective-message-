import axios from 'axios';
// Root folder se aapki JSON file ko import kar raha hoon
import interactivePayload from '../interactive-message.json';

export default async function handler(req, res) {
  // Sirf POST requests allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  /**
   * Automation Logic: 
   * Jab bhi koi naya message (incoming) aaye, tabhi reply jaye.
   */
  if (data.event === 'message_created' && data.message_type === 'incoming') {
    
    const conversationId = data.conversation.id; // Chatwoot se ID mil gayi
    const accountId = '153776'; // Aapka Account ID
    const accessToken = process.env.CHATWOOT_ACCESS_TOKEN; // Vercel Settings se aayega

    try {
      // Chatwoot API ko interactive message bhej rahe hain
      await axios.post(
        `https://app.chatwoot.com/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
        {
          ...interactivePayload, // Aapki JSON file ka content
          message_type: 'outgoing'
        },
        {
          headers: {
            'api_access_token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Interactive reply sent to conversation: ${conversationId}`);
      return res.status(200).json({ status: 'Success' });

    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      return res.status(500).json({ status: 'Error', details: error.message });
    }
  }

  // Agar message aapne (agent) ne bheja hai, toh ignore karein
  return res.status(200).json({ status: 'Ignored' });
}
