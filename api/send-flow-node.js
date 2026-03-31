import axios from 'axios';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  databaseURL: "https://success-points-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1",
  measurementId: "G-64DR1TSTKY"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, to, nodeId } = req.body;

  try {
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { accessToken, phoneId } = configSnap.data();

    const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
    const { flowData } = flowSnap.data();
    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const blocks = node.data.blocks || [];
    const textBlock = blocks.find(b => b.type === 'text');
    // Cloudinary Support: Agar image block hai toh Header banega
    const mediaBlock = blocks.find(b => b.type === 'image' || b.type === 'media'); 
    const replyButtons = blocks.filter(b => b.type === 'button' && b.subType === 'reply').slice(0, 3);
    const urlButton = blocks.find(b => b.type === 'button' && b.subType === 'url');

    let payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ''),
      type: "interactive",
    };

    // --- CASE 1: Agar URL (Link) button hai ---
    if (urlButton) {
      payload.interactive = {
        type: "cta_url",
        header: mediaBlock ? { type: "image", image: { link: mediaBlock.url } } : null,
        body: { text: textBlock?.content || "Click below to proceed:" },
        action: {
          name: "cta_url",
          parameters: { display_text: urlButton.label, url: urlButton.url }
        }
      };
    } 
    // --- CASE 2: Agar Reply (Options) buttons hain ---
    else if (replyButtons.length > 0) {
      payload.interactive = {
        type: "button",
        header: mediaBlock ? { type: "image", image: { link: mediaBlock.url } } : null,
        body: { text: textBlock?.content || "Please select an option:" },
        action: {
          buttons: replyButtons.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.label.substring(0, 20) }
          }))
        }
      };
    }
    // --- CASE 3: Sirf plain text ---
    else {
      payload.type = "text";
      payload.text = { body: textBlock?.content || "Neural Message Active" };
    }

    const metaRes = await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // History Save (Inbox ke liye saara pichhla data)
    await addDoc(collection(db, "users", userId, "messages"), {
      text: textBlock?.content || "Interactive Flow",
      sender: 'admin',
      senderNumber: to,
      wamid: metaRes.data.messages[0].id,
      platform: 'whatsapp',
      status: 'sent',
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ success: true, wamid: metaRes.data.messages[0].id });
  } catch (err) {
    console.error("API ERROR:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message });
  }
}
