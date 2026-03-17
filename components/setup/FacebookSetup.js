import React, { useState, useEffect } from 'react';
import { Facebook, Save, Copy, Shield, Loader2, Zap, X, CheckCircle2, Globe, Info, ArrowLeft } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pageData, setPageData] = useState(null); // Meta se aaya hua data
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({
    pageId: '',
    pageAccessToken: ''
  });

  const [verifyToken, setVerifyToken] = useState('');
  const webhookUrl = `https://intrective-message-vercel.app/api/messenger-webhook/${uid}`;

  // 1. Random Token Generate karne ka function
  const generateToken = () => `bk_fb_${Math.random().toString(36).substring(2, 12)}`;

  const handleVerifyAndConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) {
        return toast.error("Bhai, Page ID aur Token dono dalo!");
    }

    setLoading(true);
    try {
      // --- STEP A: META VALIDATION (Graph API) ---
      // Hum Meta se puchenge ki ye token aur ID asli hai ya nahi
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${formData.pageId}?fields=name,about,picture,link,verification_status&access_token=${formData.pageAccessToken}`
      );
      const data = await response.json();

      if (data.error) {
        setLoading(false);
        return toast.error(`Meta Reject: ${data.error.message}`);
      }

      // Agar Meta ne "Green Signal" de diya
      const metadata = {
        name: data.name,
        about: data.about || "No description available",
        profilePic: data.picture?.data?.url,
        link: data.link,
        verified: data.verification_status,
        lastVerified: new Date().toLocaleString()
      };

      setPageData(metadata);
      const newToken = generateToken();
      setVerifyToken(newToken);

      // --- STEP B: SAVE TO FIREBASE ---
      await setDoc(doc(db, "configs", uid), {
        ...formData,
        pageName: data.name,
        fbVerifyToken: newToken,
        isFbVerified: false,
        metaData: metadata,
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true); // Pop-up dikhao
      toast.success("Neural Link Verified! ✅ Page details fetched.");

    } catch (err) {
      toast.error("Network Error: Meta connection failed.");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>

        <h2 className="text-4xl font-black mb-10 text-zinc-900 dark:text-white tracking-tighter italic uppercase">
          Facebook <span className="text-blue-500">Neural Setup</span>
        </h2>

        <div className="bg-white dark:bg-[#0f0f0f] p-8 md:p-12 rounded-[3rem] border border-zinc-100 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-1">Facebook Page ID</label>
            <input 
              type="text" placeholder="1046347..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              onChange={(e) => setFormData({...formData, pageId: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-1">Page Access Token</label>
            <textarea 
              rows="3" placeholder="EAAdL..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-500 transition-all shadow-inner resize-none font-mono text-xs"
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})}
            />
          </div>

          <button 
            onClick={handleVerifyAndConnect} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group uppercase text-xs tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="group-hover:rotate-12 transition-transform" />}
            Verify & Generate Webhook
          </button>
        </div>
      </div>

      {/* POPUP MODAL (The Results) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[999] p-6">
          <div className="bg-white dark:bg-[#111] w-full max-w-xl rounded-[3rem] border border-white/10 p-10 relative shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-red-500 transition-colors"><X /></button>
            
            <div className="flex items-center gap-6 mb-10">
                <img src={pageData?.profilePic} className="w-20 h-20 rounded-[2rem] border-4 border-blue-500/20 shadow-2xl" alt="Page" />
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{pageData?.name}</h3>
                    <p className="text-blue-500 text-[10px] font-bold tracking-widest uppercase">Meta Page Verified ✅</p>
                </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-black rounded-3xl border border-white/5 relative">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">Neural Webhook URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono">{webhookUrl}</code>
                <button onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied!");}} className="absolute top-5 right-5 text-zinc-600 hover:text-white"><Copy size={14}/></button>
              </div>

              <div className="p-5 bg-black rounded-3xl border border-white/5 relative">
                <p className="text-[9px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-2xl text-green-500 font-black tracking-tighter">{verifyToken}</code>
                    <button onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied!");}} className="text-zinc-600 hover:text-white"><Copy size={16}/></button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <Info className="text-blue-500 shrink-0" size={18} />
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                   Bhai, ye details Meta Dashboard mein <b className="text-white">Messenger &gt; API Setup</b> mein dalo. Jab tak Meta "Green" na ho jaye, ye window band mat karna.
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
        
