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
  
  // 🔥 Auth instance se user nikalna
  const user = auth.currentUser;
  const userEmail = user?.email; 

  // URL encoding for safety in webhook URL
  const webhookUrl = `https://intrective-message.vercel.app/api/messenger-webhook/${encodeURIComponent(userEmail || '')}`;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });

  // --- REAL-TIME LISTENER: Monitoring the 'Email' Document ---
  useEffect(() => {
    let unsubscribe = () => {};
    if (showModal && userEmail) {
      const docRef = doc(db, "configs", userEmail);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Neural Handshake Success! ✅");
        }
      });
    }
    return () => unsubscribe(); 
  }, [showModal, userEmail]);

  const handleConnect = async () => {
    // 1. Check if user is logged in
    if (!user) {
      return toast.error("Bhai, aap logged in nahi ho. Login refresh karein.");
    }

    if (!formData.pageId || !formData.pageAccessToken) {
      return toast.error("Bhai, details toh bharo!");
    }

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);
      setIsLiveVerified(false); 

      // 2. Saving to Firestore (configs/{userEmail})
      const configRef = doc(db, "configs", userEmail);
      
      await setDoc(configRef, {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false, 
        platform: 'facebook',
        updatedAt: new Date(),
        ownerUid: user.uid // UID backup ke liye
      }, { merge: true });

      setShowModal(true);
      toast.success("Handshake Initialized! Modal dekho.");
    } catch (err) { 
        console.error("🔥 Firestore Write Error:", err); // Console mein check karo
        toast.error(`Database Save Failed: ${err.message}`); 
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white font-sans selection:bg-blue-600/20">
      <button onClick={onBack} className="mb-12 flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em]">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto bg-[#0c0c0c] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[100px] rounded-full"></div>
        <h2 className="text-3xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-3">
            <Facebook className="text-blue-500" fill="currentColor" size={32} />
            Facebook <span className="text-blue-500">Node</span>
        </h2>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 italic">Meta Page ID</label>
            <input 
              type="text" 
              placeholder="1046347..." 
              className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500/50 transition-all font-mono text-blue-400 placeholder:text-zinc-800 shadow-inner" 
              onChange={(e) => setFormData({...formData, pageId: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 italic">Access Token</label>
            <textarea 
              rows="3" 
              placeholder="EAAdL..." 
              className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-blue-500/50 transition-all font-mono text-xs text-zinc-400 placeholder:text-zinc-800 shadow-inner" 
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} 
            />
          </div>
          
          <button 
            onClick={handleConnect} 
            disabled={loading} 
            className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20 tracking-[0.2em] text-[10px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />} 
            Initialize Neural Link
          </button>
        </div>
      </div>

      {/* --- REAL-TIME HANDSHAKE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-[#0c0c0c] w-full max-w-xl rounded-[4rem] border border-white/10 p-12 relative text-center">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-all hover:rotate-90"><X /></button>
            
            <div className="mb-10">
                {isLiveVerified ? (
                    <div className="w-24 h-24 bg-green-500/20 rounded-[2.5rem] flex items-center justify-center text-green-500 mx-auto mb-6 border border-green-500/30 animate-in zoom-in duration-500">
                        <ShieldCheck size={48} />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 mx-auto mb-6 border border-blue-600/20 relative overflow-hidden">
                        <RefreshCw size={48} className="animate-spin" />
                    </div>
                )}
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isLiveVerified ? 'text-green-500' : 'text-white'}`}>
                    {isLiveVerified ? 'Handshake Success' : 'Waiting for Handshake'}
                </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-blue-500/20 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Callback URL</p>
                <div className="flex items-center justify-between gap-4">
                    <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                    <Copy size={16} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied");}} />
                </div>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group hover:border-green-500/20 transition-all">
                <p className="text-[9px] text-zinc-600 font-bold mb-2 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <Copy size={20} className="text-zinc-700 cursor-pointer hover:text-white transition-all shrink-0" onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied");}} />
                </div>
              </div>
            </div>

            <div className="mt-10">
                {isLiveVerified ? (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full bg-green-600 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all"
                    >
                        Enter Neural Inbox
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
        
