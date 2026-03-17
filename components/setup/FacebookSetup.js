import React, { useState, useEffect } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isLiveVerified, setIsLiveVerified] = useState(false); // Real-time status
  
  const uid = auth.currentUser?.uid;
  // URL format ekdum sahi (.vercel.app)
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${uid}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // --- REAL-TIME LISTENER: Meta ka handshake pakadne ke liye ---
  useEffect(() => {
    let unsubscribe = () => {};

    if (showModal && uid) {
      // Hum Firestore ke usi UID wale document ko watch kar rahe hain
      const docRef = doc(db, "configs", uid);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Meta Handshake Success! 🚀 Connection Live.");
        }
      });
    }

    return () => unsubscribe(); 
  }, [showModal, uid]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, sari details bhariye!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);
      setIsLiveVerified(false); 

      // Data save logic (Using UID as Document ID)
      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, // Default false, meta hit hone par backend true karega
        platform: 'facebook',
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
      toast.success("Neural Link Initialized! ✅");
    } catch (err) { 
        toast.error("Firebase Sync Failed. Permission check karo!"); 
        console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DASHBOARD
      </button>

      <div className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter text-blue-500">Facebook <span className="text-white">Node</span></h2>
        
        <div className="space-y-8">
          <div className="space-y-2 text-left px-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Page ID</label>
            <input type="text" placeholder="104634..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-zinc-300" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          </div>

          <div className="space-y-2 text-left px-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Permanent Token</label>
            <textarea rows="3" placeholder="EAAdL..." className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500 transition-all font-mono text-xs text-zinc-400" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          </div>
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20 text-xs tracking-widest">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Initialize Neural Path
          </button>
        </div>
      </div>

      {/* --- REAL-TIME MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-[#111] w-full max-w-lg rounded-[4rem] border border-white/10 p-12 relative text-center">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-transform hover:rotate-90"><X /></button>
            
            <div className="mb-10 flex flex-col items-center">
                {isLiveVerified ? (
                    <div className="w-24 h-24 bg-green-500/20 rounded-[3rem] flex items-center justify-center text-green-500 mb-6 border border-green-500/30 animate-in zoom-in-50 duration-500">
                        <ShieldCheck size={50} />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center text-blue-500 mb-6 border border-blue-600/20">
                        <RefreshCw size={50} className="animate-spin" />
                    </div>
                )}
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Protocol Active' : 'Waiting for Handshake'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 tracking-widest">
                    {isLiveVerified ? 'Meta has verified the connection ✅' : 'Link these in Meta Dashboard'}
                </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-blue-500/30 transition-all text-left">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Callback Webhook URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                <button onClick={() => copyToClipboard(webhookUrl, "URL")} className="absolute top-6 right-8 p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px]">COPY</button>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-green-500/30 transition-all text-left">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <button onClick={() => copyToClipboard(verifyToken, "Token")} className="p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px]">COPY</button>
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} // Inbox pe jaane ka rasta
                        className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                    >
                        Enter Neural Inbox
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                        <Info size={16} className="text-blue-500" />
                        <p className="text-[10px] text-zinc-400 italic">Meta Dashboard mein "Verify and Save" hote hi ye screen update hogi.</p>
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
        
