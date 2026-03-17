import React, { useState } from 'react';
import { Facebook, Copy, Loader2, Zap, X, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const FacebookSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const uid = auth.currentUser?.uid;

  const [formData, setFormData] = useState({ pageId: '', pageAccessToken: '' });
  const webhookUrl = `https://intrective-message-vercel.app/api/messenger-webhook/${uid}`;

  const handleConnect = async () => {
    if (!formData.pageId || !formData.pageAccessToken) return toast.error("Bhai, Details dalo!");

    setLoading(true);
    try {
      const newToken = `bk_fb_${Math.random().toString(36).substring(2, 12)}`;
      setVerifyToken(newToken);

      await setDoc(doc(db, "configs", uid), {
        pageId: formData.pageId,
        pageAccessToken: formData.pageAccessToken,
        fbVerifyToken: newToken,
        isFbVerified: false,
        updatedAt: new Date()
      }, { merge: true });

      setShowModal(true);
      toast.success("Neural Link Created! ✅");
    } catch (err) { toast.error("Firebase Sync Failed"); }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-[#080808] min-h-screen text-white font-sans">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black tracking-[0.3em]">
        <ArrowLeft size={14} /> BACK TO DASHBOARD
      </button>

      <div className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
        <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Facebook <span className="text-blue-500">Node</span></h2>
        
        <div className="space-y-6">
          <input type="text" placeholder="Facebook Page ID" className="w-full bg-black border border-white/5 rounded-2xl p-5 outline-none focus:border-blue-500 transition-all font-mono" onChange={(e) => setFormData({...formData, pageId: e.target.value})} />
          <textarea rows="3" placeholder="Permanent Page Access Token" className="w-full bg-black border border-white/5 rounded-2xl p-5 outline-none focus:border-blue-500 transition-all font-mono text-xs" onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})} />
          
          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-500 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Initialize Node
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[999] p-6">
          <div className="bg-[#111] w-full max-w-lg rounded-[3rem] border border-white/10 p-10 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X /></button>
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 italic uppercase"><CheckCircle2 className="text-blue-500" /> Webhook Ready</h3>
            
            <div className="space-y-4">
              <div className="p-5 bg-black rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 font-bold mb-1 uppercase tracking-widest">Callback URL</p>
                <code className="text-[10px] text-blue-400 break-all">{webhookUrl}</code>
              </div>
              <div className="p-5 bg-black rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 font-bold mb-1 uppercase tracking-widest">Verify Token</p>
                <code className="text-2xl text-green-500 font-black">{verifyToken}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;

