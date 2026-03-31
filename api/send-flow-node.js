import axios from 'axios';
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { userId, to, nodeId } = req.body;
  if (!userId || !to || !nodeId) return res.status(400).json({ error: "Missing parameters" });

  const cleanTo = to.replace(/\D/g, '');

  try {
    const [configSnap, flowSnap] = await Promise.all([
      getDoc(doc(db, "configs", userId)),
      getDoc(doc(db, "users", userId, "flows", "main_flow"))
    ]);

    if (!configSnap.exists() || !flowSnap.exists()) {
      return res.status(404).json({ error: "Config or Flow not found" });
    }

    const { accessToken, phoneId } = configSnap.data();
    const { flowData } = flowSnap.data();
    const node = flowData.nodes.find(n => n.id === nodeId);

    if (!node) return res.status(404).json({ error: "Node not found" });

    // 1. NEURAL VARIABLE FETCHING
    const customerSnap = await getDoc(doc(db, "users", userId, "customers", cleanTo));
    const userData = customerSnap.exists() ? customerSnap.data() : { name: "Customer" };

    const parseVars = (str) => {
      if (!str) return "";
      let temp = str;
      temp = temp.replace(/{{name}}/g, userData.name || "Customer");
      temp = temp.replace(/{{phone}}/g, cleanTo);
      Object.keys(userData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        temp = temp.replace(regex, userData[key]);
      });
      return temp;
    };

    const nodeData = node.data;
    let payload = { messaging_product: "whatsapp", recipient_type: "individual", to: cleanTo };

    // 2. HEADER CONSTRUCTION
    let headerObj = null;
    if (nodeData.header?.type === 'media' && nodeData.header.url) {
      headerObj = { type: "image", image: { link: nodeData.header.url } };
    } else if (nodeData.header?.type === 'text' && nodeData.header.text) {
      headerObj = { type: "text", text: parseVars(nodeData.header.text) };
    }

    // 3. LOGIC BIFURCATION (Text vs Interactive)
    const buttons = nodeData.buttons || [];

    if (node.type === 'listNode') {
      // --- CASE: LIST MENU ---
      payload.type = "interactive";
      payload.interactive = {
        type: "list",
        header: headerObj?.type === 'text' ? headerObj : undefined, // List supports only text headers
        body: { text: parseVars(nodeData.body) || "Please select an option:" },
        footer: nodeData.footer ? { text: parseVars(nodeData.footer) } : undefined,
        action: {
          button: nodeData.listButton || "View Menu",
          sections: [{
            title: "Options",
            rows: (nodeData.listRows || []).slice(0, 10).map(row => ({
              id: row.id,
              title: parseVars(row.title).substring(0, 24),
              description: parseVars(row.desc || "").substring(0, 72)
            }))
          }]
        }
      };
    } 
    else if (buttons.length === 0) {
      // --- CASE: NO BUTTONS (Fallback to simple text to avoid API errors) ---
      payload.type = "text";
      payload.text = { body: parseVars(nodeData.body) };
    } 
    else {
      // --- CASE: BUTTONS (Interactive) ---
      const urlBtn = buttons.find(b => b.type === 'url' || b.type === 'email');
      
      if (urlBtn) {
        // Meta Rule: CTA URL messages can't mix with reply buttons easily in standard interactive
        payload.type = "interactive";
        payload.interactive = {
          type: "cta_url",
          header: headerObj,
          body: { text: parseVars(nodeData.body) },
          footer: nodeData.footer ? { text: parseVars(nodeData.footer) } : undefined,
          action: {
            name: "cta_url",
            parameters: { 
              display_text: urlBtn.label.substring(0, 20), 
              url: urlBtn.type === 'email' ? `mailto:${urlBtn.value}` : urlBtn.value 
            }
          }
        };
      } else {
        // Quick Reply Buttons (Max 3)
        payload.type = "interactive";
        payload.interactive = {
          type: "button",
          header: headerObj,
          body: { text: parseVars(nodeData.body) },
          footer: nodeData.footer ? { text: parseVars(nodeData.footer) } : undefined,
          action: {
            buttons: buttons.slice(0, 3).map(btn => ({
              type: "reply",
              reply: { id: btn.id, title: parseVars(btn.label).substring(0, 20) }
            }))
          }
        };
      }
    }

    // 4. EXECUTE META API CALL
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 5. SAVE HISTORY
    await addDoc(collection(db, "users", userId, "messages"), {
      to: cleanTo,
      nodeId: nodeId,
      status: "sent",
      type: payload.type,
      wamid: response.data.messages[0].id,
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ success: true, messageId: response.data.messages[0].id });

  } catch (error) {
    console.error("FLOW SEND ERROR:", error.response?.data || error.message);
    return res.status(500).json({ 
      error: "Failed to send message", 
      details: error.response?.data || error.message 
    });
  }
}
