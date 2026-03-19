import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, ShieldCheck, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  
  // 🔥 SESSION FALLBACK: Firebase auth se lo, warna LocalStorage se
  const [activeEmail, setActiveEmail] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setActiveEmail(user.email.toLowerCase().trim());
      } else {
        // Agar Firebase auth null hai, toh login wala email lo
        const savedEmail = localStorage.getItem('admin_email');
        if (savedEmail) setActiveEmail(savedEmail.toLowerCase().trim());
      }
    });
    return () => unsubscribe();
  }, []);

  const webhookUrl = `https://intrective-message.vercel.app/api/meta-webhook/${encodeURIComponent(activeEmail || '')}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // REAL-TIME SYNC LISTENER
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && activeEmail) {
      const docRef = doc(db, "configs", activeEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Sync Complete!");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, activeEmail]);

  const handleConnect = async () => {
    if (!activeEmail) return toast.error("Session Error: Please Re-login!");
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, details toh bharo!");

    setLoading(true);
    try {
      const newToken = `bk_meta_${Math.random().toString(36).substring(2, 10)}`;
      setVerifyToken(newToken);

      // SAVE PATH: configs/ayushrajayushhh@gmail.com
      await setDoc(doc(db, "configs", activeEmail), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
    } catch (err) { 
        console.error(err);
        toast.error("Database Save Failed"); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white font-sans selection:bg-blue-600/20">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="max-w-xl mx-auto bg-[#0c0c0c] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-blue-500">Facebook <span className="text-white">Node</span></h2>
        
        <div className="space-y-8">
          <input type="text" placeholder="Meta Page ID" className="w-full bg-black border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          <textarea rows="3" placeholder="Access Token" className="w-full bg-black border border-white/10 rounded-2xl p-6 text-xs outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Initialize Connection
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[999] p-6 animate-in fade-in">
          <div className="bg-[#0c0c0c] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 text-center relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white"><X /></button>
            <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border transition-all duration-1000 ${isLiveVerified ? 'bg-green-600/20 text-green-500 border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                {isLiveVerified ? <ShieldCheck size={48} className="animate-in zoom-in" /> : <RefreshCw size={48} className="animate-spin" />}
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{isLiveVerified ? 'Handshake Success' : 'Awaiting Meta'}</h3>
            <p className="text-[10px] text-zinc-500 mb-8 uppercase tracking-widest font-bold">Node ID: {activeEmail}</p>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 flex justify-between items-center group">
                <code className="text-[10px] text-blue-400 truncate pr-4">{webhookUrl}</code>
                <Copy size={16} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied");}} />
              </div>
              <div className="p-6 bg-black rounded-3xl border border-white/5 flex justify-between items-center group">
                <code className="text-3xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                <Copy size={20} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied");}} />
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button onClick={() => window.location.reload()} className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-600/20">Activate Neural Inbox</button>
                ) : (
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <Info size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[9px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tight">Meta Dashboard &gt; Webhook &gt; Verify and Save karein.</p>
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
                  
