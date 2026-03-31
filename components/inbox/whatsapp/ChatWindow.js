import React, { useEffect, useRef } from 'react';
import { CheckCheck, ShieldCheck } from 'lucide-react';

const ChatWindow = ({ messages, selectedRoom }) => {
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
      {/* Chat Header */}
      <div className="px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center gap-4 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg">
          {selectedRoom?.slice(-2)}
        </div>
        <div>
          <h3 className="font-bold text-sm text-white tracking-wide">{selectedRoom}</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Secure Link Active</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 styled-scrollbar">
        {/* Encryption Badge */}
        <div className="flex justify-center mb-8">
           <div className="bg-[#111] border border-white/5 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
             <ShieldCheck size={12} className="text-green-600" /> End-to-end encrypted by BaseKey
           </div>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`relative px-5 py-3.5 rounded-3xl max-w-[75%] shadow-2xl ${
              m.sender === 'admin' 
              ? 'bg-green-600 text-white rounded-tr-none font-medium' 
              : 'bg-[#121212] border border-white/5 text-zinc-200 rounded-tl-none'
            }`}>
              <p className="text-[13.5px] leading-relaxed">{m.text}</p>
              <div className={`flex items-center justify-end gap-1.5 mt-1.5 opacity-50`}>
                <span className="text-[9px] font-bold">10:45 AM</span>
                {m.sender === 'admin' && <CheckCheck size={12} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatWindow;

