import React from 'react';
import { Mail, ChevronLeft } from 'lucide-react';
import { auth } from '../../firebase'; // Firebase auth import

export default function GmailSetup({ onBack }) {
  const handleConnect = () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      window.location.href = `/api/gmail/login?userId=${userId}`;
    }
  };

  return (
    <div className="p-8 md:p-16 h-full bg-[#080808] text-white">
      <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white mb-8">
        <ChevronLeft size={20} /> <span className="ml-2">Back</span>
      </button>
      <div className="max-w-xl">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit mb-6">
          <Mail size={40} className="text-red-500" />
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tighter italic uppercase">Connect Gmail</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          BaseKey AI ko apne Gmail se link karein taaki aapka AI assistant emails handle kar sake.
        </p>
        <button onClick={handleConnect} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-105">
          Link Google Account
        </button>
      </div>
    </div>
  );
}
