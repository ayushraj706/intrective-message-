import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';
import { Facebook, Zap, RefreshCw, ShieldCheck, X, Copy, ArrowLeft, Info, Key, Hash } from 'lucide-react';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  
  // Input states
  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  const email = auth.currentUser?.email?.toLowerCase().trim() || localStorage.getItem('admin_email');
  const webhookUrl = `https://intrective-message.vercel.app/api/meta-webhook/${encodeURIComponent(email || '')}`;

  // 📡 REAL-TIME SYNC: Meta Handshake monitor karega
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && email) {
      const docRef = doc(db, "configs", email);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Connection Verified! 🚀");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, email]);

  const handleConnect = async () => {
    if (!email) return toast.error("Bhai, login session missing hai!");
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Page ID aur Access Token dono bharo!");

    setLoading(true);
    try {
      // Naya Token Generate
      const newToken = `bk_meta_${Math.random().toString(36).substring(2, 10)}`;
      setVerifyToken(newToken);

      // 🔥 SAVE EVERYTHING: configs/ayushrajayushhh@gmail.com
      await setDoc(doc(db, "configs", email), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        updatedAt: new Date(),
        platform: 'facebook'
      }, { merge: true });

      setShowModal(true);
    } catch (e) { 
        console.error(e);
        toast.error("Database Write Failed!"); 
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white font-sans selection:bg-blue-600/30">
      {/* Back Button */}
      <button onClick={onBack} className="mb-12 flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em]">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto bg-[#0c0c0c] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-blue-600/10 rounded-3xl text-blue-500 border border-blue-500/20">
                <Facebook size={32} fill="currentColor" />
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter italic">Meta <span className="text-blue-600">Node</span></h2>
        </div>
        
        <div className="space-y-8">
          {/* Page ID Input */}
          <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Hash size={12}/> Facebook Page ID</label>
              <input 
                type="text" 
                placeholder="Ex: 10463478..." 
                className="w-full bg-black border border-white/10 rounded-2xl p-6 outline-none focus:border-blue-600 transition-all font-mono text-blue-400 placeholder:text-zinc-800" 
                onChange={(e) => setFormData({...formData, pageId: e.target.value})} 
              />
          </div>

          {/* Access Token Input */}
          <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Key size={12}/> Page Access Token</label>
              <textarea 
                rows="4" 
                placeholder="EAA..." 
                className="w-full bg-black border border-white/10 rounded-2xl p-6 outline-none focus:border-blue-600 transition-all font-mono text-xs text-zinc-500 placeholder:text-zinc-800" 
                onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} 
              />
          </div>
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} fill="currentColor" />} 
            Initialize Handshake
          </button>
        </div>
      </div>

      {/* --- REAL-TIME MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-500">
          <div className="bg-[#0c0c0c] w-full max-w-xl rounded-[4rem] border border-white/10 p-14 relative text-center shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-all"><X /></button>
            
            <div className="mb-10">
                <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border transition-all duration-1000 ${isLiveVerified ? 'bg-green-600/20 text-green-500 border-green-500/30' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                    {isLiveVerified ? <ShieldCheck size={56} className="animate-in zoom-in" /> : <RefreshCw size={56} className="animate-spin text-blue-400" />}
                </div>
                <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Link Established' : 'Awaiting Meta'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              {/* Webhook URL Display */}
              <div className="p-6 bg-black rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <div className="flex items-center justify-between gap-6">
                    <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                    <Copy size={20} className="text-zinc-700 cursor-pointer hover:text-white transition-all" onClick={() => copyToClipboard(webhookUrl)} />
                </div>
              </div>

              {/* Verify Token Display */}
              <div className="p-6 bg-black rounded-3xl border border-white/5 group hover:border-green-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-4xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <Copy size={24} className="text-zinc-700 cursor-pointer hover:text-white transition-all" onClick={() => copyToClipboard(verifyToken)} />
                </div>
              </div>
            </div>

            <div className="mt-12">
                {isLiveVerified ? (
                    <button onClick={() => window.location.reload()} className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 active:scale-95 transition-all">
                        Activate Inbox
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3 p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <Info size={16} className="text-blue-500" />
                        <p className="text-[10px] text-zinc-500 font-bold italic">Meta Dashboard &gt; Webhook &gt; Verify and Save karein.</p>
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
        
