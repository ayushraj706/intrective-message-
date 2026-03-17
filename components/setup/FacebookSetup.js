import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  const userEmail = auth.currentUser?.email;
  const uid = auth.currentUser?.uid;
  
  // URL encoding for safety
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${encodeURIComponent(userEmail || uid)}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // --- REAL-TIME LISTENER: Watch for Meta Handshake ---
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && userEmail) {
      const docRef = doc(db, "configs", userEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Connection Established! 🚀");
        }
      });
    }
    return () => unsubscribe();
  }, [showModal, userEmail]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, sari details bhariye!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);
      setIsLiveVerified(false);

      await setDoc(doc(db, "configs", userEmail), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false,
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
    } catch (err) { 
      toast.error("Neural Link failed to save."); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DASHBOARD
      </button>

      <div className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[100px] rounded-full"></div>
        
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-3">
            <Facebook className="text-blue-500" fill="currentColor" size={32} />
            Facebook <span className="text-blue-500">Node</span>
        </h2>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-[0.2em]">Page ID</label>
            <input 
              type="text" placeholder="1046347..." 
              className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500/50 transition-all font-mono text-blue-400 placeholder:text-zinc-700 shadow-inner" 
              onChange={(e) => setFormData({...formData, pageId: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-[0.2em]">Permanent Access Token</label>
            <textarea 
              rows="3" placeholder="EAAdL..." 
              className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500/50 transition-all font-mono text-xs text-zinc-400 placeholder:text-zinc-700 shadow-inner" 
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} 
            />
          </div>
          
          <button 
            onClick={handleConnect} 
            disabled={loading} 
            className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20 tracking-widest text-xs"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />} 
            Initialize Neural Link
          </button>
        </div>
      </div>

      {/* --- REAL-TIME VERIFICATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-[#111] w-full max-w-xl rounded-[4rem] border border-white/10 p-12 relative text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white hover:rotate-90 transition-all"><X /></button>
            
            <div className="mb-10">
                {isLiveVerified ? (
                    <div className="w-24 h-24 bg-green-500/20 rounded-[3rem] flex items-center justify-center text-green-500 mx-auto mb-6 border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)] animate-in zoom-in duration-500">
                        <ShieldCheck size={48} />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center text-blue-500 mx-auto mb-6 border border-blue-600/20 relative">
                        <RefreshCw size={48} className="animate-spin" />
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                    </div>
                )}
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Meta'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-[0.2em]">
                    {isLiveVerified ? 'BaseKey Node is now Online' : 'Complete setup in Meta Dashboard'}
                </p>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black/50 rounded-3xl border border-white/5 group relative hover:border-blue-500/30 transition-all">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                <button onClick={() => copyToClipboard(webhookUrl, "URL")} className="absolute top-6 right-8 p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
              </div>

              <div className="p-6 bg-black/50 rounded-3xl border border-white/5 relative group hover:border-green-500/30 transition-all">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <button onClick={() => copyToClipboard(verifyToken, "Token")} className="p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={18}/></button>
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-green-600/20 hover:bg-green-500 active:scale-95 transition-all"
                    >
                        Enter Neural Inbox
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <Info size={14} className="text-blue-500" />
                        <p className="text-[10px] text-zinc-400 font-medium">Meta Dashboard mein <span className="text-white">Verify and Save</span> karte hi ye screen update hogi.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
        
