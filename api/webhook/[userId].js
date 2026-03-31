import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import axios from "axios";

const firebaseConfig = {
  apiKey: "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8",
  authDomain: "success-points.firebaseapp.com",
  projectId: "success-points",
  storageBucket: "success-points.firebasestorage.app",
  messagingSenderId: "51177935348",
  appId: "1:51177935348:web:33fc4a6810790a3cbd29a1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;

  // 1. Meta Verification (GET)
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const userSnap = await getDoc(doc(db, "configs", userId));
    if (userSnap.exists() && token === userSnap.data().webhookVerifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification Failed');
  }

  // 2. Real-time Message Handling (POST)
  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value) return res.status(200).send("OK");

    try {
      // --- Naya Message Aaya ---
      if (value.messages && value.messages[0]) {
        const msg = value.messages[0];
        const contact = value.contacts?.[0];
        const senderNumber = msg.from;
        const senderName = contact?.profile?.name || "Customer";
        
        let incomingText = "";
        let clickedButtonId = null;

        if (msg.type === 'text') {
          incomingText = msg.text.body;
        } else if (msg.type === 'interactive') {
          // Button click data pakadna
          clickedButtonId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
          incomingText = `[Button Clicked: ${msg.interactive.button_reply?.title || 'Option'}]`;
        }

        // A. Meta ka sara data Firebase mein save karo
        await addDoc(collection(db, "users", userId, "messages"), {
          text: incomingText,
          sender: 'customer',
          senderNumber: senderNumber,
          senderName: senderName,
          wamid: msg.id,
          platform: 'whatsapp',
          status: 'received',
          messageType: msg.type,
          timestamp: serverTimestamp(),
          metadata: {
            display_phone: value.metadata?.display_phone_number,
            phone_id: value.metadata?.phone_number_id
          }
        });

        // B. Flow Builder Logic (Automated Reply)
        const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
        
        if (flowSnap.exists() && flowSnap.data().isActive) {
          const { flowData } = flowSnap.data();
          const nodes = flowData.nodes || [];
          const edges = flowData.edges || [];
          let nextNodeId = null;

          if (clickedButtonId) {
            // Agar button dabaya hai, toh edge dhoondo jiska sourceHandle button ID se match kare
            const edge = edges.find(e => e.sourceHandle === clickedButtonId);
            if (edge) nextNodeId = edge.target;
          } else {
            // Agar pehla message hai (Hi), toh Start Trigger wala node dhoondo
            const startNode = nodes.find(n => n.type === 'startNode');
            if (startNode) {
              const startEdge = edges.find(e => e.source === startNode.id);
              if (startEdge) nextNodeId = startEdge.target;
            }
          }

          // C. Reply Bhejna (AWAIT LAGANA ZAROORI HAI)
          if (nextNodeId) {
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const baseUrl = `${protocol}://${req.headers.host}`;
            
            console.log(`🤖 Triggering Flow Node: ${nextNodeId}`);
            try {
              // Yahan 'await' lagane se Vercel reply bhej kar hi function close karega
              await axios.post(`${baseUrl}/api/send-flow-node`, {
                userId, to: senderNumber, nodeId: nextNodeId
              }, { timeout: 10000 });
            } catch (err) {
              console.error("❌ Send Flow Error:", err.response?.data || err.message);
            }
          }
        }
      }

      // --- Status Updates (Ticks) ---
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const q = query(collection(db, "users", userId, "messages"), where("wamid", "==", statusObj.id));
        const snap = await getDocs(q);
        snap.forEach(async (doc) => {
          await updateDoc(doc.ref, { status: statusObj.status, updatedAt: serverTimestamp() });
        });
      }

      return res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Critical Webhook Error:", error);
      return res.status(500).send("Internal Error");
    }
  }

  res.status(405).end();
}
