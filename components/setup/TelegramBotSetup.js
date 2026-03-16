import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Bot, QrCode } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';
import axios from 'axios';

const TelegramBotSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [uid, setUid] = useState(null);
  const [botInfo, setBotInfo] = useState(null); // Bot ka username store karne ke liye

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    if (!uid) return toast.error("System busy!");
    if (!botToken.trim()) return toast.error("Bot Token khali hai!");

    setLoading(true);

    try {
      // 1. Fetch Bot Info (Isse Username milega QR code ke liye)
      const tgMe = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
      const botUsername = tgMe.data.result.username;

      // 2. Setup Webhook
      const webhookUrl = `https://intrective-message.vercel.app/api/telegram-webhook/${uid}`;
      await axios.get(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);

      // 3. Save to Firebase
      await setDoc(doc(db, "configs", uid), {
        telegramBotToken: botToken,
        telegramBotUsername: botUsername,
        updatedAt: new Date(),
        userId: uid
      }, { merge: true });

      // State update karein taaki UI par QR code dikhe
      setBotInfo(botUsername);
      toast.success("Bot Connected!", { description: "Webhook and QR Code ready." });

    } catch (err) {
      toast.error("Connection Error", { description: "Invalid Token or Network Error." });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO INBOXES
        </button>
        
        <h2 className="text-4xl font-black mb-10 text-zinc-900 dark:text-white tracking-tighter italic">
          Telegram <span className="text-blue-400">Setup</span>
        </h2>

        {!botInfo ? (
          <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] border border-zinc-100 dark:border-white/5 space-y-8 shadow-2xl relative">
            <div className="flex items-center gap-4 mb-8 bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
               <Bot className="text-blue-400" size={32} />
               <div>
                  <p className="text-sm text-white font-bold">BotFather Configuration</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Paste your HTTP API Token below</p>
               </div>
            </div>

            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Bot Token</label>
               <input 
                 type="text" 
                 placeholder="123456789:AAH_XXXXXXXXXXXXXXX" 
                 className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 dark:text-white focus:border-blue-400/50 outline-none transition-all shadow-inner font-mono text-sm" 
                 onChange={(e) => setBotToken(e.target.value)} 
               />
            </div>

            <button onClick={handleConnect} disabled={loading || !uid} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {loading ? 'Linking...' : 'Connect Bot'}
            </button>
          </div>
        ) : (
          // SUCCESS & QR CODE SCREEN (Chatwoot Style)
          <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] border border-green-500/30 space-y-8 shadow-2xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-white">Bot is Live!</h3>
            <p className="text-zinc-400 text-sm">Scan this QR code or share the link to start chatting with your bot.</p>
            
            <div className="bg-white p-4 rounded-3xl inline-block mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://t.me/${botInfo}`} 
                alt="Bot QR Code" 
                className="w-48 h-48 rounded-xl"
              />
            </div>

            <div className="mt-6 p-4 bg-black rounded-2xl border border-white/5">
               <code className="text-blue-400 font-mono">https://t.me/{botInfo}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramBotSetup;
