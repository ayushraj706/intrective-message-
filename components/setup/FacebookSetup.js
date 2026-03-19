import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, ShieldCheck, ArrowLeft, RefreshCw, Info, Globe, Lock } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        toast.error("Session Expired. Please Login.");
      }
    });
    return () => unsubscribe();
  }, []);

  const uid = currentUser?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${uid}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && uid) {
      const docRef = doc(db, "configs", uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isFbVerified === true) {
                setIsLiveVerified(true);
                toast.success("Meta Connection Established! 🚀");
            }
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, uid]);

  const handleConnect = async () => {
    if (!uid) return toast.error("Bhai, UID load hone do... thoda ruko!");
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Details fill kijiye!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);

      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        platform: 'facebook',
        updatedAt: new Date(),
        userId: currentUser.email
      }, { merge: true });

      setShowModal(true);
    } catch (err) { 
        toast.error("Database Save Failed."); 
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to Clipboard");
  };

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white font-sans selection:bg-blue-600/30">
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-16">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Base
        </button>
        <div className="flex items-center gap-3 px-5 py-2 bg-zinc-900/50 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node Sync Online</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
            <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl">
                <Facebook size={32} fill="currentColor" />
            </div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">Messenger <span className="text-blue-600">Flow</span></h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                Connect your Facebook Meta Node to enable AI automated responses.
            </p>
        </div>

        <div className="bg-[#0c0c0c] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Meta Page ID</label>
              <input 
                type="text" 
                placeholder="Enter Page ID" 
                className="w-full bg-black border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-blue-600 transition-all font-mono text-blue-400 placeholder:text-zinc-800" 
                onChange={(e) => setFormData({...formData, pageId: e.target.value})} 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Permanent Token</label>
              <textarea 
                rows="4" 
                placeholder="Paste Access Token..." 
                className="w-full bg-black border border-white/10 rounded-2xl p-6 text-xs outline-none focus:border-blue-600 transition-all font-mono text-zinc-500 placeholder:text-zinc-800" 
                onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} 
              />
            </div>
            
            <button 
                onClick={handleConnect} 
                disabled={loading || !uid} 
                className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
            >
              {!uid ? <Loader2 className="animate-spin" /> : loading ? <Loader2 className="animate-spin" /> : <Zap size={20} fill="currentColor" />} 
              {!uid ? 'Connecting Securely...' : 'Initialize Neural Link'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-500">
          <div className="bg-[#0c0c0c] w-full max-w-xl rounded-[4rem] border border-white/10 p-14 relative text-center shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-all"><X /></button>
            
            <div className="mb-10">
                <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border transition-all duration-1000 ${isLiveVerified ? 'bg-green-600/20 text-green-500 border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.3)]' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                    {isLiveVerified ? <ShieldCheck size={56} className="animate-in zoom-in" /> : <RefreshCw size={56} className="animate-spin text-blue-400" />}
                </div>
                <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Link Established' : 'Awaiting Meta'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <div className="flex items-center justify-between gap-6">
                    <code className="text-[10px] text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                    <Copy size={20} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => copyToClipboard(webhookUrl)} />
                </div>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 group hover:border-green-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-4xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <Copy size={24} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => copyToClipboard(verifyToken)} />
                </div>
              </div>
            </div>

            <div className="mt-12">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 active:scale-95 transition-all"
                    >
                        Activate Inbox
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3 p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <Info size={16} className="text-blue-500 animate-pulse" />
                        {/* 🔥 FIXED LINE BELOW (&gt; instead of >) */}
                        <p className="text-[10px] text-zinc-500 font-bold italic">Meta App Dashboard &gt; Webhook &gt; Verify and Save.</p>
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
        
