import React, { useState } from 'react';
import { Bot, ArrowLeft, Save, ShieldCheck } from 'lucide-react';

const MainDashboard = () => {
  const [setupMode, setSetupMode] = useState(null);

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Connect your official WhatsApp Business API', icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' },
    { id: 'tg-api', name: 'Telegram API', desc: 'Integrate custom Telegram Client API', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg' },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'Automate via Telegram Bot Father token', icon: 'https://static-00.iconduck.com/assets.00/telegram-icon-2048x2048-96h23s98.png' },
  ];

  if (setupMode) return <SetupForm type={setupMode} onBack={() => setSetupMode(null)} />;

  return (
    <div className="p-12 bg-[#111111] h-screen overflow-y-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tighter text-white">Inboxes</h1>
        <p className="text-gray-500 mt-2 text-lg">Choose a channel to start automation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {channels.map((ch) => (
          <div 
            key={ch.id} 
            onClick={() => setSetupMode(ch.id)}
            className="bg-[#1a1c1e] p-10 rounded-[2rem] border border-gray-800/50 hover:border-blue-500/50 hover:bg-[#202226] cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-8 border border-gray-800 group-hover:scale-110 transition-transform">
                <img src={ch.icon} className="w-10 h-10 object-contain" alt={ch.name} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">{ch.name}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{ch.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SetupForm = ({ type, onBack }) => (
    <div className="p-12 bg-[#111111] h-screen flex flex-col items-center">
        <div className="w-full max-w-2xl">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-10 transition-colors font-bold uppercase text-[10px] tracking-widest">
                <ArrowLeft size={16} /> Back to Inboxes
            </button>
            
            <h2 className="text-4xl font-extrabold mb-4 text-white">Configure {type.toUpperCase()}</h2>
            
            <div className="bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl space-y-8">
                <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">Display Name</label>
                    <input type="text" placeholder="e.g. Sales Support" className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />
                </div>
                {type === 'whatsapp' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">Phone Number ID</label>
                            <input type="text" placeholder="105928374..." className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-white" />
                        </div>
                    </div>
                )}
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95">
                    <Save size={20} /> Create Inbox
                </button>
            </div>
        </div>
    </div>
);

export default MainDashboard;
