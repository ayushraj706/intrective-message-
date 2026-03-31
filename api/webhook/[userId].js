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

  // --- 1. Meta Verification (GET) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const userSnap = await getDoc(doc(db, "configs", userId));
    if (userSnap.exists() && token === userSnap.data().webhookVerifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification Failed');
  }

  // --- 2. Real-time Handling (POST) ---
  if (req.method === 'POST') {
    const body = req.body;
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (!value) return res.status(200).send("OK");

    // --- SCENARIO A: Incoming Message (Text or Interactive Button) ---
    if (value.messages && value.messages[0]) {
      const msg = value.messages[0];
      const contact = value.contacts?.[0];
      
      const senderNumber = msg.from;
      const senderName = contact?.profile?.name || "User";
      const msgId = msg.id;
      const msgTimestamp = msg.timestamp;

      // Check message type (text or button click)
      let incomingText = "";
      let clickedButtonId = null;

      if (msg.type === 'text') {
        incomingText = msg.text.body;
      } else if (msg.type === 'interactive') {
        // Button click logic
        clickedButtonId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
        incomingText = msg.interactive.button_reply?.title || "Button Clicked";
      }

      // 1. Database mein save karo (Full Meta Data)
      await addDoc(collection(db, "users", userId, "messages"), {
        text: incomingText,
        sender: 'customer',
        senderNumber: senderNumber,
        senderName: senderName,
        wamid: msgId,
        platform: 'whatsapp',
        status: 'received',
        type: msg.type,
        timestamp: serverTimestamp(),
        meta_timestamp: msgTimestamp // Meta ka exact time
      });

      // --- 2. AUTOMATION LOGIC (Flow Builder Connection) ---
      const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
      
      if (flowSnap.exists() && flowSnap.data().isActive) {
        const { flowData } = flowSnap.data();
        const nodes = flowData.nodes;
        const edges = flowData.edges;
        let nextNodeId = null;

        if (clickedButtonId) {
          // A. Agar button click hua hai, toh agla node dhoondo
          const edge = edges.find(e => e.sourceHandle === clickedButtonId);
          if (edge) nextNodeId = edge.target;
        } else {
          // B. Agar naya message hai (Hi/Hello), toh Start Node se shuru karo
          const startEdge = edges.find(e => e.source.includes('start'));
          if (startEdge) nextNodeId = startEdge.target;
        }

        // 3. Reply bhejo agar node mila
        if (nextNodeId) {
          const targetNode = nodes.find(n => n.id === nextNodeId);
          if (targetNode) {
            // Trigger our Send Node API
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const baseUrl = `${protocol}://${req.headers.host}`;
            
            axios.post(`${baseUrl}/api/send-flow-node`, {
              userId, to: senderNumber, nodeId: nextNodeId
            }).catch(err => console.error("Flow Trigger Error:", err.message));
          }
        }
      }
    }

    // --- SCENARIO B: Status Updates (Sent/Delivered/Read) ---
    if (value.statuses && value.statuses[0]) {
      const statusObj = value.statuses[0];
      const wamid = statusObj.id;
      const newStatus = statusObj.status; // 'delivered' or 'read'

      const q = query(collection(db, "users", userId, "messages"), where("wamid", "==", wamid));
      const snap = await getDocs(q);
      snap.forEach(async (doc) => {
        await updateDoc(doc.ref, { 
          status: newStatus, 
          last_update: serverTimestamp() 
        });
      });
    }

    return res.status(200).send("EVENT_RECEIVED");
  }

  res.status(405).end();
}
