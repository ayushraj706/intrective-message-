import React from 'react';
import { Mail, ChevronLeft, ShieldCheck } from 'lucide-react';

export default function GmailSetup({ onBack }) {
  const handleConnect = () => {
    // Ye humein aapke banaye huye API route par bhej dega
    window.location.href = '/api/gmail/login';
  };

  return (
    <div className="p-8 md:p-16 h-full bg-[#080808] text-white">
      <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
        <ChevronLeft size={20} /> <span className="ml-2">Back to Inboxes</span>
      </button>

      <div className="max-w-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Mail size={32} className="text-red-500" />
        </div>
        
        <h2 className="text-4xl font-black mb-4 tracking-tighter">Connect Gmail</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          BaseKey AI ko apne Gmail se connect karein taaki aapka AI Assistant emails ka reply kar sake, 
          unhe categorize kar sake aur aapke dashboard par real-time dikha sake.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-[#111] p-4 rounded-xl border border-white/5">
            <ShieldCheck size={20} className="text-green-500 mb-2" />
            <p className="text-xs text-zinc-500">Secure OAuth 2.0 Connection</p>
          </div>
        </div>

        <button 
          onClick={handleConnect}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-red-900/20"
        >
          Connect My Gmail Account
        </button>
      </div>
    </div>
  );
}
