import React, { useState, useEffect } from 'react'; // 🔥 BUILD ERROR FIX
import { Facebook, Copy, Loader2, Zap, X, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  const userEmail = auth.currentUser?.email; // strictly using email
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${encodeURIComponent(userEmail)}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // 🔥 REAL-TIME HANDSHAKE LISTENER (Strictly on Email ID)
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && userEmail) {
      const docRef = doc(db, "configs", userEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Sync Success! 🚀");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, userEmail]);

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, sari details bhariye!");
    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 10)}`;
      setVerifyToken(newToken);
      await setDoc(doc(db, "configs", userEmail), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        updatedAt: new Date()
      }, { merge: true });
      setShowModal(true);
    } catch (err) { toast.error("Database Save Failed"); }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white font-sans">
      <button onClick={onBack} className="mb-10 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-2">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="max-w-xl mx-auto bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-blue-500">Facebook <span className="text-white">Node</span></h2>
        
        <div className="space-y-8">
          <input type="text" placeholder="Facebook Page ID" className="w-full bg-black border border-white/10 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          <textarea rows="3" placeholder="Permanent Access Token" className="w-full bg-black border border-white/10 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Initialize Connection
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in">
          <div className="bg-[#0c0c0c] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 text-center relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white"><X /></button>
            <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 transition-all duration-700 ${isLiveVerified ? 'bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                {isLiveVerified ? <ShieldCheck size={48} className="animate-in zoom-in" /> : <RefreshCw size={48} className="animate-spin" />}
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-10">{isLiveVerified ? 'Handshake Success' : 'Waiting for Meta'}</h3>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <div className="flex justify-between items-center">
                    <code className="text-[10px] text-blue-400 truncate pr-4">{webhookUrl}</code>
                    <Copy size={16} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied");}} />
                </div>
              </div>
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex justify-between items-center">
                    <code className="text-3xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                    <Copy size={20} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied");}} />
                </div>
              </div>
            </div>

            {isLiveVerified && (
               <button onClick={() => window.location.reload()} className="w-full mt-10 bg-green-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-600/20">Enter Neural Inbox</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
