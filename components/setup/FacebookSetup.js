import React, { useState, useEffect } from 'react'; // FIXED BUILD ERROR
import { Facebook, Copy, Loader2, Zap, X, ShieldCheck, ArrowLeft, RefreshCw, Radio, Image as ImageIcon, Music } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  const uid = auth.currentUser?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${uid}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // 🔥 REAL-TIME SYNC: Listen for changes in Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && uid) {
      const docRef = doc(db, "configs", uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Neural Link Synchronized!");
          // Switch to inbox logic handled by parent (Dashboard.js)
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, uid]);

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, sari details bhariye!");
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
    } catch (err) { toast.error("Cloud Sync Failed"); }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <button onClick={onBack} className="mb-12 flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em]">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Info */}
        <div className="space-y-6">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <Facebook size={28} fill="currentColor" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Meta <span className="text-blue-500 text-stroke">Node</span></h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                Connect your Facebook Page API to enable AI-powered replies, media handling, and real-time customer flow.
            </p>
            <div className="flex gap-4 pt-4">
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <ImageIcon size={18} className="text-zinc-500" />
                    <span className="text-[8px] font-bold text-zinc-600">MEDIA</span>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <Music size={18} className="text-zinc-500" />
                    <span className="text-[8px] font-bold text-zinc-600">AUDIO</span>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <Radio size={18} className="text-zinc-500" />
                    <span className="text-[8px] font-bold text-zinc-600">LIVE</span>
                </div>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-[#0c0c0c] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/5 blur-[100px] group-hover:bg-blue-600/10 transition-all duration-1000"></div>
          
          <div className="space-y-8 relative z-10">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Page Identity ID</label>
                <input type="text" placeholder="104634..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-blue-400 placeholder:text-zinc-800" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Access Token Key</label>
                <textarea rows="4" placeholder="EAAdL..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-xs text-zinc-500 placeholder:text-zinc-800" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
            </div>
            
            <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
              {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />} Initialize Connection
            </button>
          </div>
        </div>
      </div>

      {/* --- REAL-TIME VERIFICATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-500">
          <div className="bg-[#0c0c0c] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 text-center relative shadow-[0_0_100px_rgba(59,130,246,0.1)]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-all"><X /></button>
            
            <div className="mb-10">
                <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-700 ${isLiveVerified ? 'bg-green-600/20 text-green-500 border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                    {isLiveVerified ? <ShieldCheck size={48} className="animate-in zoom-in" /> : <RefreshCw size={48} className="animate-spin" />}
                </div>
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Verification Complete' : 'Awaiting Handshake'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-blue-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-[0.2em] italic">Callback URL</p>
                <div className="flex items-center justify-between gap-4">
                    <code className="text-[10px] text-blue-400 truncate font-mono">{webhookUrl}</code>
                    <Copy size={18} className="text-zinc-700 cursor-pointer hover:text-white transition-all" onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied");}} />
                </div>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-green-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-[0.2em] italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <Copy size={22} className="text-zinc-700 cursor-pointer hover:text-white transition-all" onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied");}} />
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 active:scale-95 transition-all"
                    >
                        Activate Neural Inbox
                    </button>
                ) : (
                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                        <Radio size={14} className="text-blue-500 animate-pulse" />
                        <p className="text-[10px] text-zinc-500 font-medium italic">Link credentials in Meta Developer Portal to sync.</p>
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
               
