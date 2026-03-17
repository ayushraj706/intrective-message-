import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  const userEmail = auth.currentUser?.email;
  // ZAROORI: URL spelling ekdum sahi honi chahiye (intrective-message.vercel.app)
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${encodeURIComponent(userEmail || '')}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // REAL-TIME LISTENER: Jaise hi Meta backend ko hit karega, ye modal update karega
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && userEmail) {
      const docRef = doc(db, "configs", userEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
        }
      });
    }
    return () => unsubscribe();
  }, [showModal, userEmail]);

  const handleConnect = async () => {
    if (!auth.currentUser) return toast.error("Bhai, pehle login toh kar lo!");
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, Details dalo!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);
      setIsLiveVerified(false);

      // Data save kar rahe hain (Email ID ko hi document name banaya hai)
      await setDoc(doc(db, "configs", userEmail), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false,
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
      toast.success("Sync Success! Ab Meta Dashboard mein dalo.");
    } catch (err) { 
      console.error("Sync Error Details:", err);
      toast.error(`Sync Failed: ${err.code || 'Check console'}`); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white font-sans">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em]">
        <ArrowLeft size={14} /> BACK TO DASHBOARD
      </button>

      <div className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
        <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter text-blue-500 underline decoration-blue-500/20 underline-offset-8">Facebook Node</h2>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-widest">Page ID</label>
            <input type="text" placeholder="104634..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2 tracking-widest">Permanent Token</label>
            <textarea rows="3" placeholder="EAAdL..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          </div>
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/10 tracking-widest text-xs">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />} Initialize Neural Path
          </button>
        </div>
      </div>

      {/* MODAL: Real-time Status */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6">
          <div className="bg-[#111] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 relative text-center">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white"><X /></button>
            
            <div className="mb-10">
                {isLiveVerified ? (
                    <div className="w-24 h-24 bg-green-500/20 rounded-[3rem] flex items-center justify-center text-green-500 mx-auto mb-6 border border-green-500/30">
                        <ShieldCheck size={48} />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center text-blue-500 mx-auto mb-6 border border-blue-600/20">
                        <RefreshCw size={48} className="animate-spin" />
                    </div>
                )}
                <h3 className={`text-2xl font-black italic uppercase ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Meta'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 group relative">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic font-mono">Callback URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                <button onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied!");}} className="absolute top-6 right-8 text-zinc-600 hover:text-white text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-all">COPY</button>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic font-mono">Verify Token</p>
                <code className="text-3xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                <button onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied!");}} className="absolute top-6 right-8 text-zinc-600 hover:text-white text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-all">COPY</button>
              </div>
            </div>

            {isLiveVerified && (
                <button onClick={() => setShowModal(false)} className="w-full mt-10 bg-green-600 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all">
                    Finish & Go to Inbox
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
