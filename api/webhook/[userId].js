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
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    if (!value) return res.status(200).send("OK");

    try {
      // 1. --- HAR TARAH KE MESSAGES KO PAKADNA ---
      if (value.messages && value.messages[0]) {
        const msg = value.messages[0];
        const contact = value.contacts?.[0];
        const senderNumber = msg.from;
        const senderName = contact?.profile?.name || "Customer";
        
        let incomingContent = "";
        let clickedButtonId = null;
        let extraData = {};

        // Switch case for every Meta feature
        switch (msg.type) {
          case 'text':
            incomingContent = msg.text.body;
            break;
          case 'interactive':
            clickedButtonId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
            incomingContent = `🔘 ${msg.interactive.button_reply?.title || msg.interactive.list_reply?.title}`;
            break;
          case 'image':
          case 'video':
          case 'audio':
          case 'document':
            incomingContent = `📎 Received ${msg.type}`;
            extraData = { mediaId: msg[msg.type].id, mime: msg[msg.type].mime_type, sha256: msg[msg.type].sha256 };
            break;
          case 'location':
            incomingContent = `📍 Location: ${msg.location.latitude}, ${msg.location.longitude}`;
            extraData = { lat: msg.location.latitude, long: msg.location.longitude, name: msg.location.name };
            break;
          case 'reaction':
            incomingContent = `Reacted: ${msg.reaction.emoji}`;
            extraData = { reactedTo: msg.reaction.message_id, emoji: msg.reaction.emoji };
            break;
          case 'button': // Quick reply from templates
            incomingContent = msg.button.text;
            clickedButtonId = msg.button.payload;
            break;
          default:
            incomingContent = `Unsupported Message Type: ${msg.type}`;
        }

        // --- DATABASE SAVE (Pro Level) ---
        await addDoc(collection(db, "users", userId, "messages"), {
          text: incomingContent,
          sender: 'customer',
          senderNumber,
          senderName,
          wamid: msg.id,
          platform: 'whatsapp',
          status: 'received',
          type: msg.type,
          timestamp: serverTimestamp(),
          metaData: { ...extraData, phone_id: value.metadata?.phone_number_id }
        });

        // 2. --- AUTOMATION: MULTI-NODE FLOW TRIGGER ---
        const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
        if (flowSnap.exists() && flowSnap.data().isActive) {
          const { flowData } = flowSnap.data();
          const edges = flowData.edges || [];
          let targetNodeIds = [];

          if (clickedButtonId) {
            // Find ALL connected nodes (Multi-Reply)
            targetNodeIds = edges.filter(e => e.sourceHandle === clickedButtonId).map(e => e.target);
          } else if (msg.type === 'text') {
            // First time Hi trigger
            const startNode = flowData.nodes.find(n => n.type === 'startNode');
            if (startNode) {
              targetNodeIds = edges.filter(e => e.source === startNode.id).map(e => e.target);
            }
          }

          // Trigger all connected nodes in parallel
          if (targetNodeIds.length > 0) {
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const baseUrl = `${protocol}://${req.headers.host}`;
            await Promise.all(targetNodeIds.map(nodeId => 
              axios.post(`${baseUrl}/api/send-flow-node`, { userId, to: senderNumber, nodeId })
            ));
          }
        }
      }

      // 3. --- STATUS UPDATES (Full Tracking) ---
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const wamid = statusObj.id;
        const currentStatus = statusObj.status;
        
        const q = query(collection(db, "users", userId, "messages"), where("wamid", "==", wamid));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await updateDoc(d.ref, { 
            status: currentStatus, 
            error: statusObj.errors ? statusObj.errors[0] : null,
            updatedAt: serverTimestamp() 
          });
        });
      }

      return res.status(200).send("OK");
    } catch (error) { return res.status(200).send("Error Handled"); }
  }
}
