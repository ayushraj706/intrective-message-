import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Shield, Smartphone, Key, ExternalLink } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uid, setUid] = useState(null); // UID ke liye state
  
  const [formData, setFormData] = useState({
    inboxName: '',
    phoneId: '',
    businessId: '',
    accessToken: ''
  });

  // 1. User check karne ke liye useEffect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        // Agar user nahi hai toh login par bhej do
        console.log("No user found in WhatsAppSetup");
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Webhook URL ab UID par depend karega
  const webhookUrl = uid ? `https://intrective-message.vercel.app/api/webhook/${uid}` : 'Loading...';
  const [verifyToken, setVerifyToken] = useState('');

  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  const handleConnect = async () => {
    if (!uid) {
      alert("System abhi initialize ho raha hai, thoda wait kijiye!");
      return;
    }
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      alert("Bhai, saare credentials bhariye!");
      return;
    }

    setLoading(true);
    const newToken = generateToken();
    setVerifyToken(newToken);

    try {
      // 3. Document reference mein UID use karein
      const configRef = doc(db, "configs", uid);
      await setDoc(configRef, {
        ...formData,
        webhookVerifyToken: newToken,
        isVerified: false,
        updatedAt: new Date(),
        userId: uid
      });
      
      setShowModal(true);
      
      const unsub = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.isVerified) {
          setIsVerified(true);
        }
      });
    } catch (err) {
      console.error("Firestore Error:", err);
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, field) => {
    if (!uid) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Agar UID load nahi hua toh loading spinner dikhao
  if (!uid) {
    return (
      <div className="h-screen bg-zinc-50 dark:bg-[#111] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-zinc-500 font-mono text-xs uppercase tracking-widest">Verifying Connection...</span>
      </div>
    );
  }

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#111111] h-screen overflow-y-auto transition-colors duration-300">
      {/* ... Baki ka UI wahi rahega jo aapne bheja hai ... */}
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-10 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={16} /> Back
        </button>
        
        <h2 className="text-4xl font-extrabold mb-12 text-zinc-900 dark:text-white tracking-tighter italic">Base<span className="text-blue-500">Key</span> Setup</h2>
        
        <div className="bg-white dark:bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 space-y-6 shadow-2xl">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Display Name</label>
            <input type="text" placeholder="BaseKey Official" className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none transition-all" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Phone Number ID</label>
              <div className="relative flex items-center">
                <Smartphone size={18} className="absolute left-5 text-zinc-500" />
                <input type="text" placeholder="1059..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">WABA Account ID</label>
              <input type="text" placeholder="2948..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Permanent Access Token</label>
            <div className="relative">
                <Key size={18} className="absolute left-5 top-5 text-zinc-500" />
                <textarea rows="4" placeholder="EAAG..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none resize-none" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />
            </div>
          </div>

          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Connecting...' : 'Generate Webhook'}
          </button>
        </div>
      </div>

      {/* MODAL logic (Copied from your code but fixed variables) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#1a1c1e] w-full max-w-lg rounded-[2.5rem] border border-white/5 p-10 shadow-3xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-white"><X size={24} /></button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white"><Shield className="text-blue-500" size={24} /> Webhook Configuration</h3>
            
            <div className="mt-8 space-y-4">
              <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold">CALLBACK URL</span>
                  <Copy size={14} className="cursor-pointer" onClick={() => copyToClipboard(webhookUrl, 'url')} />
                </div>
                <code className="text-[11px] text-blue-400 break-all">{webhookUrl}</code>
              </div>
              <div className="p-4 bg-black/50 border border-white/5 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold">VERIFY TOKEN</span>
                  <Copy size={14} className="cursor-pointer" onClick={() => copyToClipboard(verifyToken, 'token')} />
                </div>
                <code className="text-sm text-green-400">{verifyToken}</code>
              </div>
            </div>

            <div className="mt-8">
              {isVerified ? (
                <div className="bg-green-500/10 text-green-500 p-4 rounded-xl text-center font-bold text-sm">Successfully Connected!</div>
              ) : (
                <div className="bg-zinc-800 text-zinc-400 p-4 rounded-xl text-center text-sm animate-pulse">Waiting for Meta connection...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
        
