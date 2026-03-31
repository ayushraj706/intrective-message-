import React from 'react';
import { Send, Paperclip, Zap, Smile } from 'lucide-react';

const ChatInput = ({ inputText, setInputText, onSend }) => {
  return (
    <div className="px-6 pb-8">
      <form onSubmit={onSend} className="max-w-4xl mx-auto flex items-center gap-3 bg-zinc-900/50 border border-white/5 p-2 rounded-[2.5rem] shadow-2xl backdrop-blur-md transition-all focus-within:border-green-500/30">
        
        {/* Media aur Interactive Icons */}
        <div className="flex items-center gap-1 pl-2 shrink-0">
           <button type="button" className="p-2 text-zinc-500 hover:text-blue-400 transition-colors" title="Send Media">
             <Paperclip size={20} />
           </button>
           <button type="button" className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors" title="Interactive Flow">
             <Zap size={20} className="fill-current opacity-50 hover:opacity-100" />
           </button>
        </div>
        
        <input 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          className="flex-1 bg-transparent py-3 px-2 outline-none text-white text-[14px] placeholder:text-zinc-700" 
          placeholder="Type a message to transmit..." 
        />
        
        {/* SEND BUTTON: Ye zaroori tha */}
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="h-11 w-11 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
