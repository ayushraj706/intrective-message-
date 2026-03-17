import React, { useState } from 'react';
import { Mail, Smartphone, Bot, ChevronRight, Globe, Code, ArrowLeft } from 'lucide-react';
import GmailSettings from './settings/GmailSettings'; // Alag file logic

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState('menu'); // 'menu', 'gmail', etc.

  // Logic: Switch based on user selection
  if (activeCategory === 'gmail') {
    return <GmailSettings onBack={() => setActiveCategory('menu')} />;
  }

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans overflow-y-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic text-blue-500">System <span className="text-white">Settings</span></h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em] font-mono">Select a Neural Node to Configure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl pb-10">
        {/* GMAIL SETTING CARD */}
        <SettingCard 
          icon={<Mail className="text-red-500" />} 
          title="Gmail Inbox Engine" 
          desc="HTML Template & AI Auto-Reply Logic" 
          onClick={() => setActiveCategory('gmail')}
        />

        {/* WHATSAPP API CARD (Disabled for now) */}
        <SettingCard 
          icon={<Smartphone className="text-green-500" />} 
          title="WhatsApp API" 
          desc="Instance Config & Webhook Parameters" 
          disabled={true}
        />

        {/* TELEGRAM BOT CARD (Disabled for now) */}
        <SettingCard 
          icon={<Bot className="text-blue-400" />} 
          title="Telegram Bot" 
          desc="BotFather Token & Inline UI Settings" 
          disabled={true}
        />
      </div>
    </div>
  );
}

// Logic Component for Settings Cards
const SettingCard = ({ icon, title, desc, onClick, disabled = false }) => (
  <div 
    onClick={!disabled ? onClick : null}
    className={`p-8 rounded-[2.5rem] bg-[#111] border border-white/5 flex items-center justify-between group transition-all duration-300 shadow-2xl ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:border-blue-500/30 cursor-pointer hover:-translate-y-2'}`}
  >
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-xl tracking-tight text-zinc-200">{title}</h4>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">{desc}</p>
      </div>
    </div>
    {!disabled && <ChevronRight size={20} className="text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />}
  </div>
);
     
