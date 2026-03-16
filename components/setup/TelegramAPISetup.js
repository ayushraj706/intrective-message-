import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Globe, ShieldAlert, KeyRound } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';

const TelegramAPISetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    apiId: '',
    apiHash: '',
    phoneNumber: ''
  });
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        // Pehle se save kiya hua data load karna
        const docRef = doc(db, "configs", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().telegramApiId) {
          setFormData({
            apiId: docSnap.data().telegramApiId || '',
            apiHash: docSnap.data().telegramApiHash || '',
            phoneNumber: docSnap.data().telegramPhone || ''
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    if (!uid) return toast.error("System busy!");
    if (!formData.apiId || !formData.apiHash) {
      return toast.warning("API ID aur API Hash daalna zaroori hai!");
    }

    setLoading(true);

    try {
      // Firebase mein Client API credentials save karna
      await setDoc(doc(db, "configs", uid), {
        telegramApiId: formData.apiId,
        telegramApiHash: formData.apiHash,
        telegramPhone: formData.phoneNumber,
        telegramClientStatus: 'credentials_saved', // Abhi sirf save hua hai
        updatedAt: new Date(),
        userId: uid
      }, { merge: true });

      toast.success("API Credentials Saved!", { description: "Telegram MTProto Client configuration save ho gayi hai." });

    } catch (err) {
      toast.error("Database Error", { description: err.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        <h2 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white tracking-tighter italic">
          Telegram <span className="text-blue-500">Client API</span>
        </h2>
        <p className="text-zinc-500 mb-10 text-sm font-medium">Automate your personal Telegram account via MTProto.</p>

        <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] border border-zinc-200 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8 bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 relative z-10">
             <Globe className="text-blue-500 shrink-0" size={36} />
             <div>
                <p className="text-sm text-zinc-900 dark:text-white font-bold">MTProto Core Setup</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold mt-1">my.telegram.org Credentials</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">App API_ID</label>
               <input 
                 type="text" 
                 value={formData.apiId}
                 placeholder="e.g. 30306970" 
                 className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
                 onChange={(e) => setFormData({...formData, apiId: e.target.value})} 
               />
            </div>
            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">App API_HASH</label>
               <input 
                 type="password" 
                 value={formData.apiHash}
                 placeholder="bcb54cc5be..." 
                 className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
                 onChange={(e) => setFormData({...formData, apiHash: e.target.value})} 
               />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Linked Phone Number (Optional)</label>
             <input 
               type="text" 
               value={formData.phoneNumber}
               placeholder="+91 9876543210" 
               className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
               onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
             />
          </div>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3 relative z-10">
            <ShieldAlert size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium leading-relaxed">
              <strong>Security Note:</strong> Do not share your API Hash with anyone. In the next phase, we will generate a secure session string using these credentials.
            </p>
          </div>

          <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 relative z-10">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Encrypting & Saving...' : 'Save Neural Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramAPISetup;
