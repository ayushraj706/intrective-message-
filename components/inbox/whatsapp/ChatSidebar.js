import React from 'react';
import { Search, MessageSquare, ChevronLeft } from 'lucide-react';

const ChatSidebar = ({ rooms, selectedRoom, setSelectedRoom, onBack }) => {
  return (
    <div className={`w-full md:w-96 border-r border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-6">
        <button onClick={onBack} className="text-zinc-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-green-500 transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-green-600 shadow-lg shadow-green-600/20">
            <MessageSquare size={20} />
          </div>
          <h2 className="text-2xl font-black dark:text-white tracking-tighter italic">Base<span className="text-green-600">Key</span></h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search transmission..." 
            className="w-full bg-zinc-100 dark:bg-[#111] py-3 pl-12 pr-4 rounded-2xl text-xs outline-none focus:ring-1 ring-green-600/30 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {rooms.map(num => (
          <button 
            key={num} 
            onClick={() => setSelectedRoom(num)} 
            className={`w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all duration-300 ${
              selectedRoom === num 
              ? 'bg-green-600 text-white shadow-xl shadow-green-600/20' 
              : 'hover:bg-zinc-100 dark:hover:bg-[#151515] dark:text-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${selectedRoom === num ? 'bg-white/20' : 'bg-green-600 text-white'}`}>
              {num.slice(-2)}
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-[14px] truncate">{num}</p>
              <p className={`text-[10px] opacity-60 ${selectedRoom === num ? 'text-white' : 'text-zinc-500'}`}>Click to view chat</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
              
