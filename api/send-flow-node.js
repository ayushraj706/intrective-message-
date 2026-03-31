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
  const cleanTo = to.replace(/\D/g, '');

  try {
    // 1. WhatsApp Config & Flow Data uthao
    const [configSnap, flowSnap] = await Promise.all([
      getDoc(doc(db, "configs", userId)),
      getDoc(doc(db, "users", userId, "flows", "main_flow"))
    ]);

    if (!configSnap.exists() || !flowSnap.exists()) {
      return res.status(404).json({ error: "Configuration or Flow not found" });
    }

    const { accessToken, phoneId } = configSnap.data();
    const { flowData } = flowSnap.data();
    const node = flowData.nodes.find(n => n.id === nodeId);

    if (!node) return res.status(404).json({ error: "Node not found" });

    // 2. DYNAMIC VARIABLES FETCHING (Neural Logic)
    // Maan lo hum 'customers' collection se data uthate hain
    const customerSnap = await getDoc(doc(db, "users", userId, "customers", cleanTo));
    const userData = customerSnap.exists() ? customerSnap.data() : { name: "Customer" };

    // Function: Text replace karne ke liye
    const parseVars = (str) => {
      if (!str) return "";
      let temp = str;
      // System & Custom variables replace karo
      temp = temp.replace(/{{name}}/g, userData.name || "Customer");
      temp = temp.replace(/{{phone}}/g, cleanTo);
      // Agar businessmen ne koi aur custom var add kiya hai (e.g. {{balance}})
      Object.keys(userData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        temp = temp.replace(regex, userData[key]);
      });
      return temp;
    };

    const nodeData = node.data;
    let payload = { messaging_product: "whatsapp", to: cleanTo, type: "interactive", interactive: {} };

    // 3. HEADER CONSTRUCTION (Media vs Text)
    let headerObj = null;
    if (nodeData.header?.type === 'media' && nodeData.header.url) {
      headerObj = { type: "image", image: { link: nodeData.header.url } };
    } else if (nodeData.header?.type === 'text' && nodeData.header.text) {
      headerObj = { type: "text", text: parseVars(nodeData.header.text) };
    }

    // 4. PAYLOAD CONSTRUCTION (List vs Buttons)
    if (node.type === 'listNode') {
      // --- LIST MESSAGE PAYLOAD ---
      payload.interactive = {
        type: "list",
        header: headerObj,
        body: { text: parseVars(nodeData.body) || "Please select an option:" },
        footer: nodeData.footer ? { text: parseVars(nodeData.footer) } : undefined,
        action: {
          button: nodeData.listButton || "View Menu",
          sections: [{
            title: "Options",
            rows: (nodeData.listRows || []).map(row => ({
              id: row.id,
              title: parseVars(row.title).substring(0, 24),
              description: parseVars(row.desc).substring(0, 72)
            }))
          }]
        }
      };
    } else {
      // --- BUTTON MESSAGE PAYLOAD ---
      const buttons = nodeData.buttons || [];
      const hasUrlButton = buttons.find(b => b.type === 'url');

      if (hasUrlButton) {
        // Meta Rule: Ek message mein sirf 1 URL button ho sakta hai
        payload.interactive = {
          type: "cta_url",
          header: headerObj,
          body: { text: parseVars(nodeData.body) || "Check this out:" },
          footer: nodeData.footer ? { text: parseVars(nodeData.footer) } : undefined,
          action: {
            name: "cta_url",
            parameters: { display_text: hasUrlButton.label, url: hasUrlButton.url }
          }
        };
      } else {
        // Normal Quick Reply Buttons (Max 3)
        payload.interactive = {
          type: "button",
          header: headerObj,
          body: { text: parseVars(nodeData.body) || "How can I help you?" },
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

    // 5. Meta API Call
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 6. History Save karna (Debugging ke liye)
    await addDoc(collection(db, "users", userId, "messages"), {
      to: cleanTo,
      nodeId: nodeId,
      status: "sent",
      wamid: response.data.messages[0].id,
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ success: true, messageId: response.data.messages[0].id });

  } catch (error) {
    console.error("FLOW SEND ERROR:", error.response?.data || error.message);
    return res.status(500).json({ 
      error: "Failed to send flow node", 
      details: error.response?.data || error.message 
    });
  }
}
