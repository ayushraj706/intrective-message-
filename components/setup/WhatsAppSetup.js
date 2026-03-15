import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Shield, Smartphone, Key, ExternalLink } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  
  // --- FAST UI LOGIC ---
  // Hum pehle localStorage se UID lene ki koshish karenge (Instant load)
  const [uid, setUid] = useState(null);

  useEffect(() => {
    // 1. Check if UID is in Firebase immediately
    if (auth.currentUser) {
      setUid(auth.currentUser.uid);
    } else {
      // 2. Fallback to a listener if not ready
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) setUid(user.uid);
        else console.error("User session lost!");
      });
      return () => unsubscribe();
    }
  }, []);

  const [formData, setFormData] = useState({
    inboxName: '',
    phoneId: '',
    businessId: '',
    accessToken: ''
  });

  // User ID milte hi URL ready ho jayega
  const webhookUrl = uid ? `https://intrective-message.vercel.app/api/webhook/${uid}` : 'Generating...';
  const [verifyToken, setVerifyToken] = useState('');

  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  const handleConnect = async () => {
    if (!uid) return alert("System busy, please try again in a second!");
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      alert("Fields khali hain bhai!");
      return;
    }

    setLoading(true);
    const newToken = generateToken();
    setVerifyToken(newToken);

    try {
      const configRef = doc(db, "configs", uid);
      await setDoc(configRef, {
        ...formData,
        webhookVerifyToken: newToken,
        isVerified: false,
        updatedAt: new Date(),
        userId: uid
      });
      
      setShowModal(true);
      
      onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.isVerified) {
          setIsVerified(true);
        }
      });
    } catch (err) {
      alert("Firestore Error: " + err.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        <h2 className="text-4xl font-black mb-10 text-white tracking-tighter italic">
          WhatsApp <span className="text-blue-500">Setup</span>
        </h2>
        
        <div className="bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
          {/* Form Inputs */}
          <div className="space-y-4">
             <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-1">Inbox Identity</label>
             <input type="text" placeholder="BaseKey Official" className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Phone Number ID" className="bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
            <input type="text" placeholder="WABA Account ID" className="bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
          </div>

          <textarea rows="3" placeholder="Permanent Access Token" className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 resize-none" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />

          <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {!uid ? 'Initializing...' : 'Generate Webhook'}
          </button>
        </div>
      </div>

      {/* MODAL (Pehle jaisa hi hai, bas cleaner UI) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] w-full max-w-lg rounded-[3rem] border border-white/10 p-10 relative shadow-3xl">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X /></button>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Shield className="text-blue-500" /> Meta Webhook</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-black rounded-2xl border border-white/5">
                <p className="text-[10px] text-zinc-600 font-bold mb-2">CALLBACK URL</p>
                <code className="text-[11px] text-blue-400 break-all">{webhookUrl}</code>
                <Copy size={14} className="mt-2 text-zinc-500 cursor-pointer" onClick={() => copyToClipboard(webhookUrl, 'url')} />
              </div>
              <div className="p-4 bg-black rounded-2xl border border-white/5">
                <p className="text-[10px] text-zinc-600 font-bold mb-2">VERIFY TOKEN</p>
                <code className="text-lg text-green-400 font-mono">{verifyToken}</code>
              </div>
            </div>

            <div className="mt-8 p-4 bg-zinc-900/50 rounded-2xl text-center border border-white/5">
              {isVerified ? <span className="text-green-500 font-bold">✓ Connected to Meta</span> : <span className="text-zinc-500 animate-pulse font-medium">Waiting for Meta handshake...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
        
