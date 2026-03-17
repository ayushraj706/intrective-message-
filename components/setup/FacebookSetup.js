import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  const user = auth.currentUser;
  const uid = user?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${uid}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // REAL-TIME HANDSHAKE LISTENER
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && uid) {
      const docRef = doc(db, "configs", uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Connection Verified by Meta");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, uid]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);

      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
    } catch (err) { 
        toast.error("Database Sync Failed"); 
    }
    setLoading(false);
  };

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white font-sans overflow-y-auto">
      {/* Header Area */}
      <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">Node System Online</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-left">
            <h1 className="text-4xl font-black tracking-tight mb-2 italic">FACEBOOK <span className="text-blue-600">DEVELOPER</span></h1>
            <p className="text-zinc-500 text-sm">Configure your Facebook Page node for automated messaging flow.</p>
        </div>

        <div className="space-y-8 bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Facebook Page ID</label>
            <input 
              type="text" 
              placeholder="Enter your Page ID" 
              className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-zinc-800"
              onChange={(e) => setFormData({...formData, pageId: e.target.value})} 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Permanent Access Token</label>
            <textarea 
              rows="4" 
              placeholder="Paste your system user token here" 
              className="w-full bg-black border border-white/10 rounded-2xl p-5 text-xs font-mono focus:border-blue-600 outline-none transition-all placeholder:text-zinc-800"
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} 
            />
          </div>
          
          <button 
            onClick={handleConnect} 
            disabled={loading} 
            className="w-full bg-blue-600 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-500 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
            Initialize Neural Node
          </button>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[999] p-4">
          <div className="bg-[#0c0c0c] w-full max-w-lg rounded-[3rem] border border-white/10 p-12 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-all"><X /></button>
            
            <div className="text-center mb-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-700 ${isLiveVerified ? 'bg-green-600/20 text-green-500' : 'bg-blue-600/10 text-blue-500'}`}>
                    {isLiveVerified ? <ShieldCheck size={40} /> : <RefreshCw size={40} className="animate-spin" />}
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tight">
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Meta'}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">
                    {isLiveVerified ? 'Your webhook is now officially connected' : 'Link the credentials in your Meta App Dashboard'}
                </p>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="group relative bg-black p-5 rounded-2xl border border-white/5 transition-all hover:border-white/10">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Callback URL</p>
                <div className="flex items-center justify-between gap-4">
                    <code className="text-[10px] text-blue-400 truncate font-mono">{webhookUrl}</code>
                    <button onClick={() => copyToClipboard(webhookUrl)} className="text-zinc-500 hover:text-white transition-all">
                        <Copy size={16} />
                    </button>
                </div>
              </div>

              <div className="group relative bg-black p-5 rounded-2xl border border-white/5 transition-all hover:border-white/10">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-2xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                    <button onClick={() => copyToClipboard(verifyToken)} className="text-zinc-500 hover:text-white transition-all">
                        <Copy size={20} />
                    </button>
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-500 transition-all"
                    >
                        Enter Neural Inbox
                    </button>
                ) : (
                    <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <Info size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Meta dashboard mein <span className="text-white">Verify and Save</span> hone ke baad ye automatically active ho jayega.</p>
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
                  
