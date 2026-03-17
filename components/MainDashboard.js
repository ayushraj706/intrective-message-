import React, { useState } from 'react';
import { Smartphone, Send, Bot, Globe, Facebook, Instagram } from 'lucide-react';
import WhatsAppSetup from './setup/WhatsAppSetup';
import TelegramAPISetup from './setup/TelegramAPISetup';
import TelegramBotSetup from './setup/TelegramBotSetup';
import FacebookSetup from './setup/FacebookSetup'; // Naya component import
// Agar Instagram ka alag banaya hai toh, warna FB setup mein dono ho sakte hain
// import InstagramSetup from './setup/InstagramSetup'; 

const MainDashboard = () => {
  const [setupMode, setSetupMode] = useState(null);

  // 1. Updated Channels List with FB & Insta
  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Connect your official WhatsApp Business API', icon: <Smartphone size={32} /> },
    { id: 'facebook', name: 'Messenger', desc: 'Connect Facebook Page for automated DMs', icon: <Facebook size={32} /> },
    { id: 'instagram', name: 'Instagram', desc: 'Link Instagram Business for AI auto-replies', icon: <Instagram size={32} /> },
    { id: 'tg-api', name: 'Telegram API', desc: 'Integrate custom Telegram Client API', icon: <Globe size={32} /> },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'Automate via Telegram Bot Father token', icon: <Bot size={32} /> },
  ];

  // 2. Conditional Rendering for Setup Modes
  if (setupMode === 'whatsapp') return <WhatsAppSetup onBack={() => setSetupMode(null)} />;
  if (setupMode === 'facebook') return <FacebookSetup onBack={() => setSetupMode(null)} />;
  if (setupMode === 'instagram') return <FacebookSetup onBack={() => setSetupMode(null)} />; // Kyunki dono Meta se hain
  if (setupMode === 'tg-api') return <TelegramAPISetup onBack={() => setSetupMode(null)} />;
  if (setupMode === 'tg-bot') return <TelegramBotSetup onBack={() => setSetupMode(null)} />;

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto transition-colors duration-300">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter italic uppercase text-zinc-900 dark:text-white">
          BaseKey <span className="text-blue-500">Inboxes</span>
        </h1>
        <p className="text-zinc-500 dark:text-gray-500 mt-2 text-lg font-medium">Select a node to activate automation neural link.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {channels.map((ch) => (
          <div 
            key={ch.id} 
            onClick={() => setSetupMode(ch.id)}
            className="bg-white dark:bg-[#111] p-10 rounded-[3rem] border border-zinc-200 dark:border-white/5 hover:border-blue-500 hover:bg-zinc-100 dark:hover:bg-[#151515] cursor-pointer transition-all duration-500 group shadow-sm dark:shadow-2xl"
          >
            <div className="w-16 h-16 bg-zinc-50 dark:bg-black rounded-2xl flex items-center justify-center mb-8 border border-zinc-100 dark:border-white/5 group-hover:bg-blue-600/10 group-hover:border-blue-500 transition-all text-zinc-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                {ch.icon}
            </div>
            <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-white uppercase tracking-tighter italic group-hover:text-blue-500 transition-colors">
              {ch.name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-gray-500 leading-relaxed font-medium">
              {ch.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainDashboard;
