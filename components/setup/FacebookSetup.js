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
  const [currentUser, setCurrentUser] = useState(null); // Auth state handle karne ke liye
  
  // 1. Check Auth State Real-time
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        toast.error("Bhai, session expire ho gaya. Re-login karo.");
      }
    });
    return () => unsubscribe();
  }, []);

  const uid = currentUser?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${uid}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // 2. REAL-TIME HANDSHAKE LISTENER
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && uid) {
      const docRef = doc(db, "configs", uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Link Synchronized! 🚀");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, uid]);

  const handleConnect = async () => {
    if (!uid) return toast.error("Waiting for Secure Connection... Thoda ruko!");
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, details toh bharo!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);

      // 🔥 STRICTLY UID BASED SAVE
      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        platform: 'facebook',
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
    } catch (err) { 
        console.error("Firebase Error:", err);
        toast.error("Database Save Failed. Rules check karo!"); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white font-sans selection:bg-blue-600/30">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em]">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto bg-[#0c0c0c] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-blue-500">Facebook <span className="text-white">Node</span></h2>
        
        <div className="space-y-8">
          <input type="text" placeholder="Page ID" className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-blue-400 placeholder:text-zinc-800 shadow-inner" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          <textarea rows="3" placeholder="Access Token" className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-xs text-zinc-400 placeholder:text-zinc-800 shadow-inner" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          
          <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20 text-[10px] tracking-widest">
            {!uid ? <Loader2 className="animate-spin" /> : loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />} 
            { !uid ? 'Securing Link...' : 'Initialize Connection' }
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-[#0c0c0c] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 relative text-center">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-transform hover:rotate-90"><X /></button>
            
            <div className="mb-10 flex flex-col items-center">
                <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-700 ${isLiveVerified ? 'bg-green-600/20 text-green-500 border-green-500/30' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}>
                    {isLiveVerified ? <ShieldCheck size={48} className="animate-in zoom-in" /> : <RefreshCw size={48} className="animate-spin" />}
                </div>
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Handshake'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-blue-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic font-black">Callback URL</p>
                <div className="flex items-center justify-between">
                    <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                    <Copy size={16} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("Copied");}} />
                </div>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-green-500/30 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic font-black">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <Copy size={20} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Copied");}} />
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 active:scale-95 transition-all"
                    >
                        Activate Neural Inbox
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <Info size={14} className="text-blue-500" />
                        <p className="text-[10px] text-zinc-500 font-medium italic">Meta dashboard mein "Verify and Save" karein.</p>
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
                  
