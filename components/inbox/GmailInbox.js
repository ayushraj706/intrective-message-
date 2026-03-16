import React from 'react';
import { ChevronLeft, Mail, RefreshCcw } from 'lucide-react';

export default function GmailInbox({ onBack }) {
  return (
    <div className="p-8 md:p-16 h-full bg-[#080808] text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={20} /> <span className="ml-2">Back to Dashboard</span>
        </button>
        <button className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-all hover:rotate-180">
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="max-w-4xl">
        <h2 className="text-4xl font-black mb-2 flex items-center gap-4 tracking-tighter">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <Mail className="text-red-500" size={32} />
          </div>
          Gmail Inbox
        </h2>
        <p className="text-zinc-500 mb-12 ml-16">Real-time mail monitoring and AI auto-reply system.</p>

        {/* Empty State / Mail List Placeholder */}
        <div className="flex flex-col items-center justify-center h-80 border border-white/5 bg-[#111]/50 rounded-[2.5rem] border-dashed">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
             <Mail className="text-zinc-700" size={24} />
          </div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Connecting to Gmail API...</p>
          <p className="text-zinc-600 mt-2 text-xs">Mails fetch karne ka logic agle step mein add karenge.</p>
        </div>
      </div>
    </div>
  );
}
