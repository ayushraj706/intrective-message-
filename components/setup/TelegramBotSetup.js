import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Bot } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';
import axios from 'axios';

const TelegramBotSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    if (!uid) return toast.error("System busy!");
    if (!botToken.trim()) return toast.error("Bot Token khali hai!", { description: "BotFather se mila token yahan daalein."});

    setLoading(true);

    try {
      // 1. Firebase mein token save karo
      await setDoc(doc(db, "configs", uid), {
        telegramBotToken: botToken,
        updatedAt: new Date(),
        userId: uid
      }, { merge: true });

      // 2. Telegram API call karke Webhook set karo
      const webhookUrl = `https://intrective-message.vercel.app/api/telegram-webhook/${uid}`;
      const tgResponse = await axios.get(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);

      if (tgResponse.data.ok) {
        toast.success("Telegram Bot Connected!", { description: "Webhook successfully link ho gaya hai." });
      } else {
        toast.error("Webhook Failed", { description: "Token galat ho sakta hai." });
      }

    } catch (err) {
      toast.error("Connection Error", { description: err.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        <h2 className="text-4xl font-black mb-10 text-zinc-900 dark:text-white tracking-tighter italic">
          Telegram <span className="text-blue-500">Setup</span>
        </h2>

        <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] border border-zinc-100 dark:border-white/5 space-y-8 shadow-2xl relative">
          
          <div className="flex items-center gap-4 mb-8 bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
             <Bot className="text-blue-500" size={32} />
             <div>
                <p className="text-sm text-white font-bold">BotFather Configuration</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Paste your HTTP API Token below</p>
             </div>
          </div>

          <div className="space-y-4">
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Bot Token</label>
             <input 
               type="password" 
               placeholder="123456789:AAH_XXXXXXXXXXXXXXX" 
               className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white focus:border-blue-500/50 outline-none transition-all shadow-inner font-mono text-sm" 
               onChange={(e) => setBotToken(e.target.value)} 
             />
          </div>

          <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Linking...' : 'Connect Bot'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramBotSetup;
  
