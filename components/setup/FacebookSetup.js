import React, { useState, useEffect } from 'react';
import { Facebook, Save, Copy, Shield, Loader2, Zap, X, CheckCircle2, Globe, Info, ArrowLeft } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pageData, setPageData] = useState(null);
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({
    pageId: '',
    pageAccessToken: ''
  });

  const [verifyToken, setVerifyToken] = useState('');
  const webhookUrl = `https://intrective-message-vercel.app/api/messenger-webhook/${uid}`;

  const generateToken = () => `bk_fb_${Math.random().toString(36).substring(2, 12)}`;

  const handleVerifyAndConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) {
        return toast.error("Bhai, Page ID aur Token dono dalo!");
    }

    setLoading(true);
    try {
      // --- STEP 1: NEURAL FETCH (Minimal Fields) ---
      // Sirf id, name aur picture mang rahe hain taaki Error #100 ke chances kam ho jayein
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${formData.pageAccessToken}`
      );
      const data = await response.json();

      // Placeholder Data (Agar Meta reject kar de)
      let metadata = {
        name: "Facebook Node",
        profilePic: "https://www.facebook.com/images/fb_icon_325x325.png",
        lastVerified: new Date().toLocaleString(),
        isFallback: true
      };

      // --- STEP 2: SMART VALIDATION ---
      if (data && !data.error) {
        metadata.name = data.name;
        metadata.profilePic = data.picture?.data?.url || metadata.profilePic;
        metadata.isFallback = false;
        toast.success(`Meta Linked: ${data.name} ✅`);
      } else {
        // Agar Meta info nahi deta, toh hum setup nahi rokenge
        console.warn("Meta Data Blocked (Error 100/Permissions). Using Fallback Name.");
        toast.info("Neural Link Secure (Limited Metadata mode).");
      }

      const newToken = generateToken();
      setVerifyToken(newToken);

      // --- STEP 3: FIREBASE SYNC (Full Automation) ---
      // Setup hamesha save hoga chahe Meta metadata de ya na de
      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        pageName: metadata.name,
        fbVerifyToken: newToken,
        isFbVerified: false,
        metaData: metadata,
        updatedAt: new Date()
      }, { merge: true });

      setPageData(metadata);
      setShowModal(true); 

    } catch (err) {
      toast.error("Network Error: Meta connection timed out.");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto scrollbar-hide">
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
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1 italic">Facebook Page ID</label>
            <input 
              type="text" placeholder="10463478518..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl p-5 text-zinc-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              onChange={(e) => setFormData({...formData, pageId: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1 italic">Page Access Token</label>
            <textarea 
              rows="3" placeholder="EAAdL..." 
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl p-5 text-zinc-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-inner resize-none font-mono text-xs"
              onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})}
            />
          </div>

          <button 
            onClick={handleVerifyAndConnect} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group uppercase text-xs tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="group-hover:rotate-12 transition-transform" />}
            Verify & Generate Neural Path
          </button>
        </div>
      </div>

      {/* MODAL SECTION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[999] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] w-full max-w-xl rounded-[3.5rem] border border-white/10 p-10 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-red-500 transition-colors transition-transform hover:rotate-90"><X /></button>
            
            <div className="flex items-center gap-6 mb-10">
                <img src={pageData?.profilePic} className="w-20 h-20 rounded-[2rem] border-4 border-blue-500/20 shadow-2xl" alt="Page" />
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{pageData?.name}</h3>
                    <p className="text-blue-500 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                        <CheckCircle2 size={12} /> Meta Protocol Initialized
                    </p>
                </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group">
                <p className="text-[9px] text-zinc-500 font-bold mb-3 uppercase tracking-widest italic">Callback Webhook URL</p>
                <code className="text-[10px] text-blue-400 break-all font-mono leading-relaxed">{webhookUrl}</code>
                <button onClick={() => {navigator.clipboard.writeText(webhookUrl); toast.success("URL Copied!");}} className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={14}/></button>
              </div>

              <div className="p-6 bg-black rounded-3xl border border-white/5 relative group">
                <p className="text-[9px] text-zinc-500 font-bold mb-3 uppercase tracking-widest italic">Verify Token</p>
                <div className="flex items-center justify-between">
                    <code className="text-3xl text-green-500 font-black tracking-tighter font-mono">{verifyToken}</code>
                    <button onClick={() => {navigator.clipboard.writeText(verifyToken); toast.success("Token Copied!");}} className="p-2 bg-white/5 rounded-xl text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Copy size={16}/></button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex gap-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Info className="text-blue-500" size={20} />
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                   Bhai, ye <b className="text-white">Verify Token</b> aur <b className="text-white">URL</b> copy karke Meta Dashboard mein dalo. Meta Handshake ke bina system active nahi hoga.
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
        
