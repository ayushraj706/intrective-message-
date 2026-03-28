import React, { useState } from 'react';
import { Mail, Smartphone, Bot, ChevronRight, ShieldCheck } from 'lucide-react';
import GmailSettings from './settings/GmailSettings';
import TwoFactorSettings from './settings/TwoFactorSettings'; // Naya import

export default function Settings() {
  const [currentView, setCurrentView] = useState('menu');

  // Views Logic
  if (currentView === 'gmail') {
    return <GmailSettings onBack={() => setCurrentView('menu')} />;
  }
  
  if (currentView === '2fa') {
    return <TwoFactorSettings onBack={() => setCurrentView('menu')} />;
  }

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in fade-in duration-500">
      <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">System <span className="text-blue-500">Settings</span></h2>
      <p className="text-zinc-500 mb-12 text-sm font-medium font-mono tracking-widest uppercase opacity-70">Neural Node Configuration</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* GMAIL SETTING CARD */}
        <SettingCard 
          icon={<Mail className="text-red-500" />} 
          title="Gmail Node" 
          desc="Custom HTML templates & AI logic injection." 
          onClick={() => setCurrentView('gmail')}
        />

        {/* 2FA & PHONE LINK (NEW) */}
        <SettingCard 
          icon={<ShieldCheck className="text-blue-500" />} 
          title="Security & 2FA" 
          desc="Link Phone Number via Telegram OTP." 
          onClick={() => setCurrentView('2fa')}
        />

        {/* WHATSAPP (COMING SOON) */}
        <SettingCard 
          icon={<Smartphone className="text-green-500" />} 
          title="WhatsApp API" 
          desc="Webhook keys & Instance management." 
          disabled={true}
        />

        {/* TELEGRAM (COMING SOON) */}
        <SettingCard 
          icon={<Bot className="text-blue-400" />} 
          title="Telegram Bot" 
          desc="BotFather tokens & Inline keyboard presets." 
          disabled={true}
        />
      </div>
    </div>
  );
}

// Card Component (Same as before)
const SettingCard = ({ icon, title, desc, onClick, disabled = false }) => (
  <div 
    onClick={!disabled ? onClick : null}
    className={`p-8 rounded-[2.5rem] bg-[#111] border border-white/5 flex items-center justify-between group transition-all duration-300 ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:border-blue-500/30 cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'}`}
  >
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-xl tracking-tight">{title}</h4>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1 font-semibold">{desc}</p>
      </div>
    </div>
    {!disabled && <ChevronRight size={20} className="text-zinc-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />}
  </div>
);
     
