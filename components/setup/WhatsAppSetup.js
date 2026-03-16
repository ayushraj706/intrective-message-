import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Shield, Smartphone, Key, ExternalLink } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner'; // Naya import

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [uid, setUid] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      setUid(auth.currentUser.uid);
    } else {
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

  const webhookUrl = uid ? `https://intrective-message.vercel.app/api/webhook/${uid}` : 'Generating...';
  const [verifyToken, setVerifyToken] = useState('');

  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  // --- CONNECT LOGIC (Updated with Toasts) ---
  const handleConnect = async () => {
    if (!uid) {
      toast.error("System Busy!", { description: "User identity fetch ho rahi hai, ek second rukiye." });
      return;
    }

    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      toast.error("Fields khali hain bhai!", { 
        description: "Inbox Name, Phone ID aur Access Token bharna zaroori hai.",
        duration: 4000 
      });
      return;
    }

    setLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const newToken = generateToken();
        setVerifyToken(newToken);

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
            toast.success("Meta Handshake Successful!", { description: "Aapka webhook verify ho gaya hai." });
          }
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise, {
      loading: 'Saving configuration...',
      success: 'Configuration Saved Successfully!',
      error: (err) => `Firestore Error: ${err.message}`,
    });

    setLoading(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    toast.success(`${field} copied!`, { description: "Ab ise Meta dashboard mein paste karein." });
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto scrollbar-hide">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        <h2 className="text-4xl font-black mb-10 text-zinc-900 dark:text-white tracking-tighter italic">
          WhatsApp <span className="text-blue-500 text-3xl">Setup</span>
        </h2>
        
        <div className="bg-white dark:bg-[#0f0f0f] p-8 md:p-12 rounded-[3rem] border border-zinc-100 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>

          <div className="space-y-4 relative">
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Inbox Identity</label>
             <input type="text" placeholder="e.g. BaseKey Official" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white focus:border-blue-500/50 outline-none transition-all shadow-inner" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Phone Number ID</label>
               <input type="text" placeholder="1027632..." className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white outline-none focus:border-blue-500/50 shadow-inner" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
            </div>
            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">WABA Account ID</label>
               <input type="text" placeholder="2108033..." className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white outline-none focus:border-blue-500/50 shadow-inner" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 relative">
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Permanent Access Token</label>
             <textarea rows="3" placeholder="EAAbp..." className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white outline-none focus:border-blue-500/50 resize-none shadow-inner" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />
          </div>

          <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
            {!uid ? 'Initializing Link...' : 'Generate Neural Webhook'}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] w-full max-w-lg rounded-[3rem] border border-zinc-200 dark:border-white/10 p-10 relative shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-red-500 transition-colors"><X /></button>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-8 flex items-center gap-3 italic tracking-tighter">
              <Shield className="text-blue-500" /> Meta Webhook
            </h3>
            
            <div className="space-y-6">
              <div className="p-5 bg-zinc-50 dark:bg-black rounded-3xl border border-zinc-100 dark:border-white/5 group relative">
                <p className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest">CALLBACK URL</p>
                <code className="text-[11px] text-blue-500 dark:text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                <button onClick={() => copyToClipboard(webhookUrl, 'URL')} className="absolute top-5 right-5 p-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-400 hover:text-blue-500 transition-all">
                  <Copy size={14} />
                </button>
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-black rounded-3xl border border-zinc-100 dark:border-white/5 group relative">
                <p className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest">VERIFY TOKEN</p>
                <div className="flex items-center justify-between">
                  <code className="text-2xl text-green-500 font-black font-mono tracking-tighter">{verifyToken}</code>
                  <button onClick={() => copyToClipboard(verifyToken, 'Token')} className="p-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-400 hover:text-green-500 transition-all">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`mt-10 p-5 rounded-[2rem] text-center border transition-all duration-700 ${isVerified ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-400'}`}>
              {isVerified ? (
                <div className="flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em]">
                  <CheckCircle2 size={16} /> Link Verified & Secure
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="font-bold uppercase text-[9px] tracking-[0.3em] animate-pulse">Waiting for Meta Handshake...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
  
