import axios from 'axios';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// FIXED: Tumhari config yahan poori honi chahiye
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

async function getFirebaseApp() {
  const existingApps = getApps();
  return existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { userId, to, nodeId } = req.body;
  if (!userId || !to || !nodeId) return res.status(400).json({ error: "Missing Parameters" });

  try {
    const app = await getFirebaseApp();
    const db = getFirestore(app);

    // 1. User ki Config uthao (Meta Tokens ke liye)
    const configSnap = await getDoc(doc(db, "configs", userId));
    if (!configSnap.exists()) return res.status(404).json({ error: "User config missing" });
    const { accessToken, phoneId } = configSnap.data();

    // 2. Flow Builder ka data uthao
    const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
    if (!flowSnap.exists()) return res.status(404).json({ error: "Flow not found" });

    const flowData = flowSnap.data().flowData;
    // Node dhoondho jo Webhook ne bheji hai
    const targetNode = flowData.nodes.find(n => n.id === nodeId);
    if (!targetNode) return res.status(404).json({ error: "Node not found in canvas" });

    const blocks = targetNode.data.blocks || [];
    const textBlock = blocks.find(b => b.type === 'text');
    const buttonBlocks = blocks.filter(b => b.type === 'button').slice(0, 3); // WhatsApp limit is 3

    // 3. Interactive Payload (WhatsApp Buttons)
    const payload = {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ''),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: textBlock?.content || "Please select an option:" },
        action: {
          buttons: buttonBlocks.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.label.substring(0, 20) } 
          }))
        }
      }
    };

    // 4. Meta ko bhejona
    const metaRes = await axios.post(`https://graph.facebook.com/v18.0/${phoneId}/messages`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const wamid = metaRes.data.messages[0].id;

    // 5. History Save (Inbox sync)
    await addDoc(collection(db, "users", userId, "messages"), {
      text: textBlock?.content || "Sent an interactive message",
      sender: 'admin',
      senderNumber: to,
      wamid: wamid,
      status: 'sent',
      type: 'interactive',
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ success: true, wamid });
  } catch (error) {
    console.error("API ERROR:", error.response?.data || error.message);
    return res.status(500).json({ error: error.message });
  }
}
