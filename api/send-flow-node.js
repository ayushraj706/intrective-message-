import axios from 'axios';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase config (Tumhari purani file se)
const firebaseConfig = { /* ... tumhari config ... */ };

async function getFirebaseApp() {
  const existingApps = getApps();
  return existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Input: userId, to (number), aur nodeId (Flow Builder wala)
  const { userId, to, nodeId } = req.body;
  if (!userId || !to || !nodeId) return res.status(400).json({ error: "Missing Parameters" });

  try {
    const app = await getFirebaseApp();
    const db = getFirestore(app);

    // 1. User ki Config uthao
    const configSnap = await getDoc(doc(db, "configs", userId));
    const { accessToken, phoneId } = configSnap.data();

    // 2. Flow Builder ka data uthao
    const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
    if (!flowSnap.exists()) return res.status(404).json({ error: "Flow not found" });

    const flowData = flowSnap.data().flowData;
    const targetNode = flowData.nodes.find(n => n.id === nodeId);
    if (!targetNode) return res.status(404).json({ error: "Node not found" });

    // 3. Flow Node se WhatsApp Payload banana
    const blocks = targetNode.data.blocks || [];
    const textBlock = blocks.find(b => b.type === 'text');
    const buttonBlocks = blocks.filter(b => b.type === 'button').slice(0, 3); // Meta sirf 3 buttons allow karta hai

    // Interactive Payload Construction
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ''),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: textBlock?.content || "Select an option:" },
        action: {
          buttons: buttonBlocks.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.label.substring(0, 20) } // Max 20 chars
          }))
        }
      }
    };

    // 4. Meta ko bhejona
    const metaRes = await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const wamid = metaRes.data.messages[0].id;

    // 5. Inbox mein save karna taaki Dashboard par dikhe
    await addDoc(collection(db, "users", userId, "messages"), {
      text: textBlock?.content || "Interactive Flow Message",
      sender: 'admin',
      senderNumber: to,
      wamid: wamid,
      type: 'interactive',
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ success: true, wamid });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
