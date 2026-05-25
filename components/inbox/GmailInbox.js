import React, { useState, useEffect } from 'react';
import { ChevronLeft, Mail, RefreshCcw, Loader2, Send } from 'lucide-react';
import { auth } from '../../firebase';

export default function GmailInbox({ onBack }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    try {
      const res = await fetch(`/api/gmail/fetch-emails?userId=${userId}`);
      const data = await res.json();
      setEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, []);

  return (
    <div className="p-6 md:p-12 h-full bg-[#080808] text-white overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white transition-all group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1" /> <span className="ml-2 font-mono text-[10px] uppercase tracking-widest">Neural Back</span>
        </button>
        <button onClick={fetchEmails} className={`p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCcw size={20} />
        </button>
      </div>

      <h2 className="text-4xl font-black mb-8 tracking-tighter italic uppercase flex items-center gap-4">
        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20"><Mail className="text-red-500" size={28} /></div>
        Gmail <span className="text-zinc-500">Node</span>
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-red-500" />
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600">Syncing Data Stream...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div key={email.id} className="bg-[#111] p-6 rounded-3xl border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-zinc-200 truncate pr-4 text-lg">{email.subject}</h4>
                <span className="text-[10px] font-mono text-zinc-600 uppercase whitespace-nowrap">{new Date(email.date).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-red-500/70 mb-3 font-medium">{email.from}</p>
              <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed font-light">{email.snippet}</p>
              <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="flex items-center gap-2 text-[10px] font-bold uppercase bg-white/5 px-4 py-2 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/5">
                   <Send size={12} /> Auto Reply
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
