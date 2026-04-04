import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import axios from "axios";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCDmDsi_JMQgx_QO4p8bnvfh-vKdN4Bmk8", // Recommendation: Use .env
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

  // --- 1. GET METHOD (Meta Verification Handshake) ---
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const userRef = doc(db, "configs", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && token === userSnap.data().webhookVerifyToken) {
      console.log(`[Verification] User ${userId} verified successfully.`);
      await updateDoc(userRef, { 
        isVerified: true, 
        lastVerifiedAt: serverTimestamp() 
      });
      return res.status(200).send(challenge);
    }
    console.error(`[Verification Failed] Token mismatch for user ${userId}`);
    return res.status(403).send('Failed');
  }

  // --- 2. POST METHOD (Receiving Messages & Status) ---
  if (req.method === 'POST') {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return res.status(200).send("OK");

    try {
      // --- CHATWOOT FEATURE 1: Inactive Number Check ---
      const phoneNumber = value.metadata?.display_phone_number;
      const configSnap = await getDoc(doc(db, "globalConfigs", "whatsapp")); 
      const inactiveNumbers = configSnap.exists() ? configSnap.data().inactiveNumbers || [] : [];

      if (inactiveNumbers.includes(phoneNumber)) {
        console.warn(`[Rejected] Webhook for inactive WhatsApp number: ${phoneNumber}`);
        return res.status(422).json({ error: 'Inactive WhatsApp number' });
      }

      // --- MESSAGES LOGIC ---
      if (value.messages && value.messages[0]) {
        const msg = value.messages[0];
        
        // --- CHATWOOT FEATURE 2: Echo Prevention ---
        // Agar message humne hi API se bheja hai, toh use ignore karein (duplicate loop rokne ke liye)
        if (msg.from === phoneNumber) {
            console.log("[Echo] Ignoring self-sent message");
            return res.status(200).send("OK");
        }

        const contact = value.contacts?.[0];
        const senderNumber = msg.from;
        const senderName = contact?.profile?.name || "Customer";
        
        let incomingContent = "";
        let clickedButtonId = null;
        let extraData = {};

        // Aapka purana Switch logic (Sahi hai)
        switch (msg.type) {
          case 'text': incomingContent = msg.text.body; break;
          case 'interactive':
            clickedButtonId = msg.interactive.button_reply?.id || msg.interactive.list_reply?.id;
            incomingContent = `🔘 ${msg.interactive.button_reply?.title || msg.interactive.list_reply?.title}`;
            break;
          case 'image':
          case 'video':
          case 'audio':
          case 'document':
            incomingContent = `📎 Received ${msg.type}`;
            extraData = { mediaId: msg[msg.type].id, mime: msg[msg.type].mime_type };
            break;
          case 'location':
            incomingContent = `📍 Location: ${msg.location.latitude}, ${msg.location.longitude}`;
            extraData = { lat: msg.location.latitude, long: msg.location.longitude };
            break;
          case 'reaction':
            incomingContent = `Reacted: ${msg.reaction.emoji}`;
            extraData = { emoji: msg.reaction.emoji };
            break;
          case 'button':
            incomingContent = msg.button.text;
            clickedButtonId = msg.button.payload;
            break;
          default: incomingContent = `Unsupported: ${msg.type}`;
        }

        console.log(`[Incoming Message] From: ${senderNumber}, Type: ${msg.type}`);

        // Database mein save
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

        // Flow Automation (Purana Logic)
        const flowSnap = await getDoc(doc(db, "users", userId, "flows", "main_flow"));
        if (flowSnap.exists() && flowSnap.data().isActive) {
          const { flowData } = flowSnap.data();
          const edges = flowData.edges || [];
          let targetNodeIds = [];

          if (clickedButtonId) {
            targetNodeIds = edges.filter(e => e.sourceHandle === clickedButtonId).map(e => e.target);
          } else if (msg.type === 'text') {
            const startNode = flowData.nodes.find(n => n.type === 'startNode');
            if (startNode) targetNodeIds = edges.filter(e => e.source === startNode.id).map(e => e.target);
          }

          if (targetNodeIds.length > 0) {
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const baseUrl = `${protocol}://${req.headers.host}`;
            // Background ki tarah trigger karein (Vercel optimization)
            targetNodeIds.forEach(nodeId => {
                axios.post(`${baseUrl}/api/send-flow-node`, { userId, to: senderNumber, nodeId }).catch(e => console.error("Flow error", e.message));
            });
          }
        }
      }

      // --- STATUS UPDATES (Purana logic safe hai) ---
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const q = query(collection(db, "users", userId, "messages"), where("wamid", "==", statusObj.id));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await updateDoc(d.ref, { 
            status: statusObj.status, 
            updatedAt: serverTimestamp() 
          });
        });
      }

      // Meta ko 200 OK turant bhej dein
      return res.status(200).send("OK");
    } catch (error) { 
      console.error(`[Webhook Error] User: ${userId}, Error: ${error.message}`);
      return res.status(200).send("Error Handled"); 
    }
  }
}
