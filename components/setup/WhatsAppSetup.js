import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, 
  Shield, Smartphone, Key, Zap, Fingerprint, MousePointer2 
} from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'; 
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [uid, setUid] = useState(null);
  const [dbData, setDbData] = useState(null); // Suggestions ke liye

  const [formData, setFormData] = useState({
    inboxName: '',
    phoneId: '',
    businessId: '',
    accessToken: ''
  });

  // 1. DATA SYNC & SUGGESTIONS LOGIC
  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    setUid(userId);

    const configRef = doc(db, "configs", userId);
    const unsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbData(data); // Suggestions save karo
        setIsVerified(data.isVerified || false);
        // Agar pehle se token hai toh wahi use karo
        if (data.webhookVerifyToken) setVerifyToken(data.webhookVerifyToken);
      }
    });
    return () => unsub();
  }, []);

  const [verifyToken, setVerifyToken] = useState('');
  const webhookUrl = uid ? `https://intrective-message.vercel.app/api/webhook/${uid}` : 'Linking...';

  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  // --- REVERT FIX & SAVE LOGIC ---
  const handleConnect = async () => {
    if (!uid) return;
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      toast.error("Required fields missing!");
      return;
    }

    setLoading(true);
    try {
      const newToken = verifyToken || generateToken();
      setVerifyToken(newToken);

      const configRef = doc(db, "configs", uid);
      
      // FIX: { merge: true } aur isVerified ko tabhi false karna jab naya ho
      const updatePayload = {
        ...formData,
        webhookVerifyToken: newToken,
        updatedAt: new Date(),
        userId: uid
      };

      // Sirf naye setup ke liye isVerified reset karo
      if (!isVerified) updatePayload.isVerified = false;

      await setDoc(configRef, updatePayload, { merge: true });
      
      setShowModal(true);
      toast.success("Neural Link Synced!");
    } catch (err) {
      toast.error(`Sync Error: ${err.message}`);
    }
    setLoading(false);
  };

  // --- QUICK FILL SUGGESTION COMPONENT ---
  const SuggestionBar = ({ field, value }) => {
    if (!value || formData[field] === value) return null;
    return (
      <motion.div 
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={() => setFormData({ ...formData, [field]: value })}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-lg cursor-pointer hover:bg-blue-600/20 transition-all mb-2 w-fit"
      >
        <Fingerprint size={12} className="text-blue-500" />
        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Use saved: {value.substring(0, 15)}...</span>
      </motion.div>
    );
  };

  return (
    <div className="p-6 md:p-12 bg-[#050505] min-h-screen overflow-y-auto scrollbar-hide text-white">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-8 text-[10px] font-black tracking-[0.3em] flex items-center gap-2 transition-all group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO SYSTEM
        </button>
        
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Neural Integration</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase">WhatsApp <span className="text-blue-600">Setup</span></h2>
        </div>
        
        <div className="bg-zinc-900/30 backdrop-blur-md p-8 md:p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative">
          
          {/* Inbox Name */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Inbox Identity</label>
             <SuggestionBar field="inboxName" value={dbData?.inboxName} />
             <input value={formData.inboxName} type="text" placeholder="BaseKey Official" className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all font-bold text-sm" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>

          {/* IDs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Phone Number ID</label>
               <SuggestionBar field="phoneId" value={dbData?.phoneId} />
               <input value={formData.phoneId} type="text" placeholder="102763..." className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">WABA Account ID</label>
               <SuggestionBar field="businessId" value={dbData?.businessId} />
               <input value={formData.businessId} type="text" placeholder="210803..." className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
            </div>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Permanent Access Token</label>
             <SuggestionBar field="accessToken" value={dbData?.accessToken} />
             <textarea value={formData.accessToken} rows="3" placeholder="EAAbp..." className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all font-mono text-[10px] resize-none" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect} 
            disabled={loading || !uid} 
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-[2rem] font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Generate Neural Webhook
          </motion.button>
        </div>
      </div>

      {/* MODAL (Meta Webhook) */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[999] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#111] w-full max-w-lg rounded-[3rem] border border-white/10 p-10 relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[100px] rounded-full" />
              
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={20}/></button>
              
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Shield className="text-blue-600" /> Meta Webhook
              </h3>
              
              <div className="space-y-6">
                <CopyBox label="CALLBACK URL" value={webhookUrl} />
                <CopyBox label="VERIFY TOKEN" value={verifyToken} color="text-green-500" />
              </div>

              <div className={`mt-10 p-6 rounded-[2.5rem] text-center border transition-all duration-1000 ${isVerified ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                {isVerified ? (
                  <div className="flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em]">
                    <CheckCircle2 size={18} /> Neural Link Active
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="font-black uppercase text-[9px] tracking-[0.3em] animate-pulse">Scanning Handshake...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Copy Component
const CopyBox = ({ label, value, color = "text-blue-400" }) => {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} Copied`);
  };
  return (
    <div className="p-5 bg-black rounded-3xl border border-white/5 relative group">
      <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-widest">{label}</p>
      <code className={`text-[11px] font-mono break-all pr-10 block ${color}`}>{value}</code>
      <button onClick={copy} className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
        <Copy size={14} />
      </button>
    </div>
  );
};

export default WhatsAppSetup;
            
