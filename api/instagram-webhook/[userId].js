// ... (Firebase init same as above) ...

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const userSnap = await getDoc(doc(db, "configs", userId));
    if (token === userSnap.data()?.instaVerifyToken) return res.status(200).send(challenge);
    return res.status(403).send('Insta Failed');
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'instagram') {
      const entry = body.entry[0].messaging[0];
      const senderId = entry.sender.id;
      const messageText = entry.message?.text || "📷 Insta Media";

      if (entry.message && !entry.message.is_echo) {
        await addDoc(collection(db, "users", userId, "messages"), {
          text: messageText,
          sender: 'customer',
          senderNumber: senderId,
          timestamp: serverTimestamp(),
          roomId: senderId,
          platform: 'instagram',
          status: 'received'
        });

        const baseUrl = `https://${req.headers.host}`;
        await axios.post(`${baseUrl}/api/ai-handler`, {
          userId, platform: 'instagram', roomId: senderId, text: messageText
        }).catch(e => {});
      }
      return res.status(200).send('OK');
    }
  }
}
