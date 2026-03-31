import { initializeApp, getApps } from "firebase/app";
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const userSnap = await getDoc(doc(db, "configs", userId));
    if (userSnap.exists() && token === userSnap.data().webhookVerifyToken) return res.status(200).send(challenge);
    return res.status(403).send('Failed');
  }

  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value) return res.status(200).send("OK");

    try {
      // 1. INCOMING MESSAGE HANDLING (Full Data)
      if (value.messages && value.messages[0]) {
        const msg = value.messages[0];
        const contact = value.contacts?.[0];
        const senderNumber = msg.from;
        const senderName = contact?.profile?.name || "Customer";
        
        let incomingText = "";
        let clickedButtonId = null;

        if (msg.type === 'text') incomingText = msg.text.body;
        else if (msg.type === 'interactive') {
          clickedButtonId = msg.interactive.button_reply?.id;
          incomingText = `🔘 ${msg.interactive.button_reply?.title}`;
        }

        // Pichhla saara data + naye metadata parameters
        await addDoc(collection(db, "users", userId, "messages"), {
          text: incomingText,
          sender: 'customer',
          senderNumber,
          senderName,
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

        // 2. AUTOMATION: Flow Trigger (Wait for reply before ending)
        const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
        if (flowSnap.exists() && flowSnap.data().isActive) {
          const { flowData } = flowSnap.data();
          const edges = flowData.edges || [];
          const nodes = flowData.nodes || [];
          let nextNodeId = null;

          if (clickedButtonId) {
            const edge = edges.find(e => e.sourceHandle === clickedButtonId);
            if (edge) nextNodeId = edge.target;
          } else {
            const startNode = nodes.find(n => n.type === 'startNode');
            if (startNode) {
              const startEdge = edges.find(e => e.source === startNode.id);
              if (startEdge) nextNodeId = startEdge.target;
            }
          }

          if (nextNodeId) {
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const baseUrl = `${protocol}://${req.headers.host}`;
            // AWAIT LAGANA ZAROORI HAI: Taaki Vercel function kill na kare
            await axios.post(`${baseUrl}/api/send-flow-node`, {
              userId, to: senderNumber, nodeId: nextNodeId
            }).catch(e => console.log("Flow Send Err:", e.message));
          }
        }
      }

      // 3. STATUS UPDATES (Ticks Sync)
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const q = query(collection(db, "users", userId, "messages"), where("wamid", "==", statusObj.id));
        const snap = await getDocs(q);
        snap.forEach(async (document) => {
          await updateDoc(document.ref, { 
            status: statusObj.status, 
            last_status_update: serverTimestamp() 
          });
        });
      }

      return res.status(200).send("OK");
    } catch (error) {
      console.error("WEBHOOK ERROR:", error.message);
      return res.status(200).send("Error Logged");
    }
  }
}
