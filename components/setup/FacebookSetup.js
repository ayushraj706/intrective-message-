import React, { useState } from 'react';
import { Facebook, Save, Copy, Shield, Loader2, Zap } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({
    pageName: '',
    pageId: '', // FB mein Phone ID nahi Page ID hoti hai
    pageAccessToken: '' // Woh lambi key jo aapne copy ki thi
  });

  const [verifyToken] = useState(`bk_fb_${Math.random().toString(36).substring(7)}`);
  const webhookUrl = `https://intrective-message-vercel.app/api/messenger-webhook/${uid}`;

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) {
        return toast.error("Bhai, Page ID aur Access Token zaroori hai!");
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "configs", uid), {
        ...formData,
        fbVerifyToken: verifyToken, // Yahi token Meta dashboard mein jayega
        isFbVerified: false,
        updatedAt: new Date()
      }, { merge: true });
      
      toast.success("Config Saved! Ab Meta Dashboard par Verify karein.");
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white">
      <h2 className="text-3xl font-black mb-8 italic uppercase">Facebook <span className="text-blue-500">Neural Setup</span></h2>
      
      <div className="max-w-2xl bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-6">
        <div>
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Facebook Page ID</label>
           <input type="text" placeholder="Get this from Page Settings" className="w-full bg-black border border-white/5 rounded-2xl p-4 mt-2" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
        </div>

        <div>
           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Page Access Token</label>
           <textarea rows="3" placeholder="Paste the EAAdL... token here" className="w-full bg-black border border-white/5 rounded-2xl p-4 mt-2" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
        </div>

        <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
            <p className="text-[10px] text-zinc-400 uppercase mb-2">Meta Webhook URL</p>
            <code className="text-xs text-blue-400 break-all">{webhookUrl}</code>
        </div>

        <div className="p-4 bg-green-600/5 border border-green-500/20 rounded-2xl">
            <p className="text-[10px] text-zinc-400 uppercase mb-2">Meta Verify Token</p>
            <code className="text-xl text-green-500 font-black">{verifyToken}</code>
        </div>

        <button onClick={handleConnect} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Activate Messenger Node
        </button>
      </div>
    </div>
  );
};

export default FacebookSetup;
