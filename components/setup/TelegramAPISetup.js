import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';

const TelegramAPISetup = ({ onBack }) => {
  return (
    <div className="p-12 bg-[#111111] h-screen text-white">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-10 font-bold uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="text-4xl font-extrabold mb-4 tracking-tighter">Telegram API Setup</h2>
      <p className="text-gray-500 mb-8">Telegram Client API configuration coming soon...</p>
      
      <div className="bg-[#1a1c1e] p-8 rounded-[2rem] border border-gray-800">
        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-4">API ID / Hash</label>
        <input type="text" className="w-full bg-[#111] border border-gray-800 rounded-xl px-5 py-4 mb-6" placeholder="Enter Details" />
        <button className="w-full bg-blue-600 py-4 rounded-xl font-bold">Save Telegram API</button>
      </div>
    </div>
  );
};

export default TelegramAPISetup;
