import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false); // Real-time state
  
  const userEmail = auth.currentUser?.email;
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${userEmail}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // --- REAL-TIME HANDSHAKE LISTENER ---
  useEffect(() => {
    let unsubscribe = () => {};

    if (showModal && userEmail) {
      // Firestore ko listen karo real-time mein
      const docRef = doc(db, "configs", userEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Handshake Successful! Node is Live. ✅");
        }
      });
    }

    return () => unsubscribe(); // Modal band hone par listener hata do
  }, [showModal, userEmail]);

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, Details dalo!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);
      setIsLiveVerified(false); // Reset status

      await setDoc(doc(db, "configs", userEmail), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, // Shuru mein false
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
      toast.success("Neural Path Created! Ab Meta Dashboard mein dalo.");
    } catch (err) { toast.error("Sync Failed"); }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DASHBOARD
      </button>

      <div className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] rounded-full"></div>
        <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter text-blue-500">Facebook <span className="text-white">Node</span></h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2">Page ID</label>
            <input type="text" placeholder="104634..." className="w-full bg-black border border-white/5 rounded-2xl p-5 outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase px-2">Permanent Token</label>
            <textarea rows="3" placeholder="EAAdL..." className="w-full bg-black border border-white/5 rounded-2xl p-5 outline-none focus:border-blue-500 transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          </div>
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-3 active:scale-95 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Initialize Neural Link
          </button>
        </div>
      </div>

      {/* MODAL: Real-time Verification status */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-[#111] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 relative shadow-[0_50px_100px_rgba(0,0,0,1)]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-transform hover:rotate-90"><X /></button>
            
            <div className="flex flex-col items-center text-center mb-10">
                {isLiveVerified ? (
                    <div className="w-20 h-20 bg-green-500/20 rounded-[2.5rem] flex items-center justify-center text-green-500 mb-4 animate-bounce">
                        <ShieldCheck size={40} />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 mb-4">
                        <RefreshCw size={40} className="animate-spin" />
                    </div>
                )}
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Meta'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-widest">
                    {isLiveVerified ? 'Connection Established ✅' : 'Paste details in Meta Dashboard...'}
                </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-6 bg-black rounded-[2.5rem] border border-white/5 group relative transition-all hover:border-blue-500/30">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                <button onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied!");}} className="absolute top-6 right-8 text-zinc-600 hover:text-white text-[10px] font-bold italic opacity-0 group-hover:opacity-100 transition-all">COPY</button>
              </div>

              <div className="p-6 bg-black rounded-[2.5rem] border border-white/5 relative group transition-all hover:border-green-500/30">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <code className="text-3xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                <button onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied!");}} className="absolute top-6 right-8 text-zinc-600 hover:text-white text-[10px] font-bold italic opacity-0 group-hover:opacity-100 transition-all">COPY</button>
              </div>
            </div>

            {isLiveVerified && (
                <button onClick={() => setShowModal(false)} className="w-full mt-10 bg-green-600 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                    Proceed to Inbox
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
        
