import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MessageSquare, Globe, ChevronLeft, Paperclip, Loader2, Facebook, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const InboxBase = ({ platform, themeColor, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  // ZAROORI: Messenger setup mein humne Email use kiya tha, toh yahan bhi wahi priority denge
  const currentUserId = auth.currentUser?.email || auth.currentUser?.uid;

  const config = {
    green: { bg: 'bg-green-600', text: 'text-green-500', icon: <MessageSquare size={16}/> },
    'blue-bot': { bg: 'bg-blue-400', text: 'text-blue-400', icon: <Send size={16}/> },
    'blue-api': { bg: 'bg-blue-600', text: 'text-blue-600', icon: <Globe size={16}/> },
    // NAYA: Messenger Theme
    'messenger': { bg: 'bg-blue-600', text: 'text-blue-600', icon: <Facebook size={16}/> }
  }[themeColor] || { bg: 'bg-zinc-600', text: 'text-zinc-500', icon: <User size={16}/> };

  useEffect(() => {
    if (!currentUserId) return;
    
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Platform filter logic
      const filtered = allMsgs.filter(m => {
        if (platform === 'whatsapp') return !m.platform || m.platform === 'whatsapp';
        if (platform === 'facebook') return m.platform === 'facebook' || m.platform === 'messenger';
        return m.platform === platform;
      });

      setMessages(filtered);

      // ZAROORI: Facebook mein 'senderId' hota hai, WhatsApp mein 'senderNumber'
      // Hum dono ko handle karenge
      const unique = [...new Set(filtered.map(m => m.senderNumber || m.senderId))].filter(Boolean).reverse();
      setRooms(unique);
    });
  }, [currentUserId, platform]);

  // Auto-scroll logic
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

    const apiMap = { 
      whatsapp: '/api/send-message', 
      telegram: '/api/send-telegram', 
      'telegram-api': '/api/send-telegram-client',
      'facebook': '/api/send-messenger' // Naya API Endpoint
    };

    try {
      const textToSend = inputText;
      setInputText('');
      
      await axios.post(apiMap[platform], { 
        userId: currentUserId, 
        to: selectedRoom, 
        text: textToSend 
      });
      
    } catch (err) { 
      toast.error(err.response?.data?.error || "Failed to send neural response"); 
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      
      {/* Sidebar: Chat Rooms */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20">
          <button onClick={onBack} className="text-zinc-500 mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-500 transition-colors">
            <ChevronLeft size={14} /> Back to Nodes
          </button>
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${config.bg}`}>{config.icon}</div>
             <div>
                <h2 className="text-xl font-black dark:text-white uppercase italic tracking-tighter">{platform}</h2>
                <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Neural Stream Active</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(id => {
            const lastMsg = messages.findLast(m => (m.senderNumber === id || m.senderId === id));
            return (
              <button 
                key={id} 
                onClick={() => setSelectedRoom(id)} 
                className={`w-full p-5 rounded-[2rem] text-left transition-all border ${
                  selectedRoom === id 
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 shadow-xl' 
                  : 'border-transparent hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                        <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-xs dark:text-white truncate uppercase italic italic tracking-tighter">
                            {lastMsg?.senderName || `ID: ${id.slice(-6)}`}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate mt-1 font-medium">{lastMsg?.text || "No messages"}</p>
                    </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat: Neural Thread */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {selectedRoom ? (
          <>
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-black/60 backdrop-blur-xl flex items-center justify-between z-10">
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${config.bg} shadow-lg shadow-blue-600/20`}>
                    <User size={14}/>
                  </div>
                  <h3 className="font-black dark:text-white uppercase text-xs italic tracking-widest">
                    {messages.findLast(m => (m.senderNumber === selectedRoom || m.senderId === selectedRoom))?.senderName || `User: ${selectedRoom}`}
                  </h3>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-32 scrollbar-hide">
              {messages.filter(m => (m.senderNumber === selectedRoom || m.senderId === selectedRoom)).map((m, i) => (
                <div key={i} className={`flex ${m.type === 'outgoing' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`p-5 rounded-[2.5rem] max-w-[75%] text-xs font-medium leading-relaxed shadow-2xl border border-white/5 ${
                    m.type === 'outgoing' 
                    ? `${config.bg} text-white rounded-tr-none` 
                    : 'bg-white dark:bg-zinc-900 dark:text-white rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="absolute bottom-8 left-0 right-0 px-8">
              <form onSubmit={handleSend} className="bg-white dark:bg-[#111] p-3 rounded-[2.5rem] flex gap-3 border border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <input 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  className="flex-1 bg-transparent px-6 outline-none dark:text-white text-xs font-bold uppercase tracking-widest" 
                  placeholder="Type neural command..." 
                />
                <button className={`p-4 rounded-[1.8rem] text-white transition-all active:scale-95 shadow-lg ${config.bg}`}>
                    <Send size={18}/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-20">
            <MessageSquare size={100} className="mb-4" />
            <p className="text-xl font-black italic uppercase tracking-tighter">Select a Neural Thread</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxBase;
    
