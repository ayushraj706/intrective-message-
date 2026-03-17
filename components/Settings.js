import React, { useState } from 'react';
import { Mail, Smartphone, Bot, ChevronRight, Settings as SettingsIcon, Globe, Code } from 'lucide-react';

// Sub-Components (Inhe hum baad mein alag files mein move kar sakte hain)
import GmailSettings from './settings/GmailSettings'; 

export default function Settings() {
  const [currentSetting, setCurrentSetting] = useState('menu'); // 'menu', 'gmail', 'whatsapp', 'telegram'

  // Menu View: Jahan saare options dikhenge
  if (currentSetting === 'menu') {
    return (
      <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white">
        <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">System <span className="text-blue-500">Settings</span></h2>
        <p className="text-zinc-500 mb-12 text-sm font-medium">Configure your neural nodes and automation protocols.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <SettingCard 
            icon={<Mail className="text-red-500" />} 
            title="Gmail Settings" 
            desc="Manage HTML templates and AI auto-reply logic." 
            onClick={() => setCurrentSetting('gmail')}
          />
          <SettingCard 
            icon={<Smartphone className="text-green-500" />} 
            title="WhatsApp API" 
            desc="Webhooks, interactive buttons, and instance config." 
            onClick={() => alert('WhatsApp Settings Coming Soon!')}
            disabled={true}
          />
          <SettingCard 
            icon={<Bot className="text-blue-400" />} 
            title="Telegram Bot" 
            desc="BotFather tokens and inline keyboard presets." 
            onClick={() => alert('Telegram Settings Coming Soon!')}
            disabled={true}
          />
          <SettingCard 
            icon={<SettingsIcon className="text-zinc-400" />} 
            title="Account Profile" 
            desc="Update your profile name, password and link." 
            onClick={() => alert('Profile Settings Coming Soon!')}
          />
        </div>
      </div>
    );
  }

  // Gmail Setting View
  if (currentSetting === 'gmail') {
    return <GmailSettings onBack={() => setCurrentSetting('menu')} />;
  }

  return null;
}

// Chota Component for Setting Cards
const SettingCard = ({ icon, title, desc, onClick, disabled = false }) => (
  <div 
    onClick={!disabled ? onClick : null}
    className={`p-6 rounded-[2rem] bg-[#111] border border-white/5 flex items-center justify-between group transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 cursor-pointer hover:-translate-y-1'}`}
  >
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-zinc-200">{title}</h4>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{desc}</p>
      </div>
    </div>
    {!disabled && <ChevronRight size={18} className="text-zinc-700 group-hover:text-white transition-colors" />}
  </div>
);
              
