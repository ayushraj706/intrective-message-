import React from 'react';
import { ChevronLeft, Mail, RefreshCcw } from 'lucide-react';

export default function GmailInbox({ onBack }) {
  return (
    <div className="p-8 md:p-16 h-full bg-[#080808] text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={20} /> <span className="ml-2">Back</span>
        </button>
        <button className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
          <RefreshCcw size={20} />
        </button>
      </div>

      <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
        <Mail className="text-red-500" /> Gmail Inbox
      </h2>

      {/* Yahan hum baad mein Email List dikhayenge */}
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/5 rounded-[2rem]">
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Mails fetching logic coming soon...</p>
      </div>
    </div>
  );
}

