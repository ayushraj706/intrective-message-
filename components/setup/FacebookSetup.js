import React, { useState } from 'react';
import { Facebook, Save, Copy, Shield, Loader2, Zap, X, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({
    pageId: '',
    pageAccessToken: ''
  });

  const webhookUrl = `https://intrective-message-vercel.app/api/messenger-webhook/${uid}`;

  // Random Token Generator
  const generateToken = () => `bk_fb_${Math.random().toString(36).substring(2, 12)}`;

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) {
        return toast.error("Bhai, Page ID aur Token dono bharna zaroori hai!");
    }

    setLoading(true);
    try {
      const newToken = generateToken();
      setVerifyToken(newToken);

      // --- DIRECT FIREBASE SYNC ---
      // Ab hum Meta se puchenge nahi, seedha config save karenge
      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false,
        platform: 'facebook',
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true); 
      toast.success("Neural Path Created! Ab Meta Dashboard par link karein.");

    } catch (err) {
      toast.error("Firebase Error: Data save nahi ho paya.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto scrollbar-hide transition-colors duration-500">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-black tracking-[0.3em] flex items-center gap-2 transition-all group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> BACK TO DASHBOARD
        </button>

        <h2 className="text-4xl font-black mb-10 text-zinc-900 dark:text-white tracking-tighter italic uppercase">
          Facebook <span className="text-blue-500">Neural Setup</span>
        </h2>

        <div className="bg-white dark:bg-[#0f0f0f] p-8 md:p-12 rounded-[3.5rem] border border-zinc-100 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[100px] rounded-full"></div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2 italic">Facebook Page ID</label>
            <input 
              type="text" placeholder="e.g. 1046347851..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[2rem] p-6 text-zinc-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-inner font-mono"
              onChange={(e) => setFormData({...formData, pageId: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2 italic">Permanent Page Access Token</label>
            <textarea 
              rows="4" placeholder="Paste your Never-Expiring token here..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[2rem] p-6 text-zinc-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-inner resize-none font-mono text-xs leading-relaxed"
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})}
            />
          </div>

          <button 
            onClick={handleConnect} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.2rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] group uppercase text-xs tracking-[0.2em]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="group-hover:rotate-12 transition-transform" />}
            Initialize Messenger Node
          </button>
        </div>
      </div>

      {/* MODAL SECTION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[999] p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-[#111] w-full max-w-xl rounded-[4rem] border border-white/10 p-12 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-red-500 transition-all hover:rotate-90"><X /></button>
            
            <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                    <Facebook size={40} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Messenger <span className="text-blue-500">Node</span></h3>
                    <p className="text-green-500 text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2 mt-1">
                        <CheckCircle2 size={12} /> Protocol Ready to Link
                    </p>
                </div>
            </div>

            <div className="space-y-6">
              <div className="p-7 bg-black/50 rounded-[2.5rem] border border-white/5 relative group transition-colors hover:border-blue-500/30">
                <p className="text-[9px] text-zinc-500 font-black mb-3 uppercase tracking-[0.2em] italic">Callback Webhook URL</p>
                <code className="text-[11px] text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                <button onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied!");}} className="absolute top-7 right-7 p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
              </div>

              <div className="p-7 bg-black/50 rounded-[2.5rem] border border-white/5 relative group transition-colors hover:border-green-500/30">
                <p className="text-[9px] text-zinc-500 font-black mb-3 uppercase tracking-[0.2em] italic">Meta Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-4xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <button onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied!");}} className="p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={18}/></button>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex gap-5 items-start">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="text-blue-500" size={24} />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                   Bhai, ye details Meta Dashboard mein <b className="text-white tracking-wide">Messenger &gt; API Setup</b> mein dalo. Jab tak Meta handshake complete na ho, ye path secure nahi hoga.
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
        
