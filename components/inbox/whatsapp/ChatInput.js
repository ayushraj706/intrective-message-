import React from 'react';
import { Send, Paperclip, Zap, Smile } from 'lucide-react';

const ChatInput = ({ inputText, setInputText, onSend }) => {
  return (
    <div className="p-6 bg-gradient-to-t from-black to-transparent z-10">
      <form onSubmit={onSend} className="max-w-4xl mx-auto flex items-center gap-3 bg-[#111] border border-white/5 p-2 rounded-[2rem] shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1 pl-2">
           <button type="button" className="p-2 text-zinc-500 hover:text-green-500 transition-colors">
             <Paperclip size={20} />
           </button>
           <button type="button" className="p-2 text-zinc-500 hover:text-yellow-500 transition-colors">
             <Zap size={20} className="fill-current opacity-50 hover:opacity-100" />
           </button>
        </div>
        
        <input 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          className="flex-1 bg-transparent py-3 px-2 outline-none text-white text-sm placeholder:text-zinc-700" 
          placeholder="Message..." 
        />
        
        <button className="h-11 w-11 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all">
          <Send size={18} className="ml-1" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;

