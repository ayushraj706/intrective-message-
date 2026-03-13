import React, { useState } from 'react';
import { Smartphone, Send, Bot, ArrowLeft, Save } from 'lucide-react';

const MainDashboard = () => {
  const [setupMode, setSetupMode] = useState(null); // 'whatsapp', 'tg-api', 'tg-bot'

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Support your customers on WhatsApp', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-8 h-8" /> },
    { id: 'tg-api', name: 'Telegram API', desc: 'Make a custom channel using API', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" className="w-8 h-8" /> },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'Configure Telegram channel using Bot token', icon: <Bot className="w-8 h-8 text-blue-400" /> },
  ];

  if (setupMode) return <SetupForm type={setupMode} onBack={() => setSetupMode(null)} />;

  return (
    <div className="p-10 bg-[#121416] min-h-screen text-white">
      <div className="mb-8">
        <span className="text-gray-500 text-sm">Back</span>
        <h1 className="text-3xl font-bold mt-2 tracking-tight">Inboxes</h1>
        <p className="text-gray-400 mt-2">Choose a channel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((ch) => (
          <div 
            key={ch.id} 
            onClick={() => setSetupMode(ch.id)}
            className="bg-[#1a1c1e] p-8 rounded-2xl border border-gray-800 hover:border-blue-500 cursor-pointer transition-all group"
          >
            <div className="mb-6">{ch.icon}</div>
            <h3 className="text-lg font-bold mb-2">{ch.name}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{ch.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Setup Form Component
const SetupForm = ({ type, onBack }) => {
  return (
    <div className="p-10 bg-[#121416] min-h-screen text-white animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-all">
        <ArrowLeft size={18} /> Back to Inboxes
      </button>
      
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold mb-2">Configure {type.toUpperCase()}</h2>
        <p className="text-gray-400 mb-10 text-sm">Apne credentials yahan enter karein aur naya inbox banayein.</p>

        <div className="space-y-6 bg-[#1a1c1e] p-8 rounded-3xl border border-gray-800">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Inbox Name (Display Name)</label>
            <input type="text" placeholder="e.g. My Support WhatsApp" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all" />
          </div>

          {type === 'whatsapp' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Phone Number ID</label>
                <input type="text" placeholder="1234567890" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Access Token</label>
                <textarea placeholder="EAAG..." rows="3" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Bot Token / API Key</label>
              <input type="password" placeholder="Enter Token" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
            <Save size={18} /> Create Inbox
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
