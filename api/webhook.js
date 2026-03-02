import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body;

    // 1. Check karein ki message 'contact' (user) ne bheja hai ya nahi
    if (data.event === 'message_created' && data.message_type === 'incoming') {
      
      const conversation_id = data.conversation.id; // ID apne aap mil gayi!
      const account_id = '153776'; // Aapka Account ID
      const access_token = process.env.CHATWOOT_ACCESS_TOKEN; // Vercel se aayega

      // 2. Aapka Interactive Message JSON yahan paste karein
      const interactive_payload = {
        "content": "Aapka Main Message",
        "content_type": "input_select",
        "content_attributes": {
          "items": [
            { "title": "Notes", "value": "notes_click" },
            { "title": "Quiz", "value": "quiz_click" }
          ]
        }
      };

      try {
        // 3. Chatwoot ko wapas reply bhejein
        await axios.post(
          `https://app.chatwoot.com/api/v1/accounts/${account_id}/conversations/${conversation_id}/messages`,
          { ...interactive_payload, message_type: "outgoing" },
          { headers: { 'api_access_token': access_token } }
        );
        return res.status(200).json({ message: 'Auto-reply sent!' });
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
      }
    }
    return res.status(200).send('Event ignored');
  }
  res.status(405).send('Method Not Allowed');
}
