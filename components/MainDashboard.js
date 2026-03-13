import React, { useState } from 'react';
import { Smartphone, Send, Bot, Globe } from 'lucide-react';
import WhatsAppSetup from './setup/WhatsAppSetup';
import TelegramAPISetup from './setup/TelegramAPISetup';
import TelegramBotSetup from './setup/TelegramBotSetup';

const MainDashboard = () => {
  const [setupMode, setSetupMode] = useState(null);

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Connect your official WhatsApp Business API', icon: <Smartphone size={32} /> },
    { id: 'tg-api', name: 'Telegram API', desc: 'Integrate custom Telegram Client API', icon: <Globe size={32} /> },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'Automate via Telegram Bot Father token', icon: <Bot size={32} /> },
  ];

  if (setupMode === 'whatsapp') return <WhatsAppSetup onBack={() => setSetupMode(null)} />;
  if (setupMode === 'tg-api') return <TelegramAPISetup onBack={() => setSetupMode(null)} />;
  if (setupMode === 'tg-bot') return <TelegramBotSetup onBack={() => setSetupMode(null)} />;

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#111111] h-screen overflow-y-auto transition-colors duration-300">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">Inboxes</h1>
        <p className="text-zinc-500 dark:text-gray-500 mt-2 text-lg font-medium">Choose a channel to start automation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {channels.map((ch) => (
          <div 
            key={ch.id} 
            onClick={() => setSetupMode(ch.id)}
            className="bg-white dark:bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-zinc-200 dark:border-gray-800/50 hover:border-blue-500 hover:bg-zinc-100 dark:hover:bg-[#202226] cursor-pointer transition-all duration-300 group shadow-sm dark:shadow-2xl"
          >
            <div className="w-16 h-16 bg-zinc-50 dark:bg-[#111] rounded-2xl flex items-center justify-center mb-8 border border-zinc-100 dark:border-gray-800 group-hover:bg-blue-600/10 group-hover:border-blue-500 transition-all text-zinc-400 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                {ch.icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">{ch.name}</h3>
            <p className="text-sm text-zinc-500 dark:text-gray-500 leading-relaxed font-medium">{ch.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainDashboard;
