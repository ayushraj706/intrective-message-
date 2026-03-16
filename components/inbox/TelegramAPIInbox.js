import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, Globe, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const TelegramAPIInbox = ({ onBack }) => {
  const platform = 'telegram-api';
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  // --- REAL-TIME SYNC WITH FIREBASE ---
  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter for Telegram API platform only
      const filteredMsgs = allMsgs.filter(m => m.platform === 'telegram-api');
      setMessages(filteredMsgs);

      // Create unique rooms based on roomId (ID provided by Render listener)
      const uniqueIds = [...new Set(filteredMsgs.map(m => m.roomId || m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueIds);
    });
    
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedRoom]);

  // --- SENDING LOGIC ---
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    
    const textToSend = inputText;
    setInputText('');

    try {
      // API call to Vercel backend
      await axios.post('/api/send-telegram-client', { 
        userId: currentUserId, 
        to: selectedRoom, 
        text: textToSend 
      });
    } catch (err) { 
      toast.error("Neural link failed to transmit message!"); 
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get contact info from the last message in a room
  const getRoomData = (roomId) => {
    return messages.findLast(m => (m.roomId === roomId || m.senderNumber === roomId));
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden transition-all duration-500">
      
      {/* SIDEBAR: CHAT LIST */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-600 shadow-lg shadow-blue-600/20">
                <Globe size={16} />
            </div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter italic uppercase">
              Neural <span className="text-blue-600">Inbox</span>
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search encrypted chats..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white focus:ring-1 focus:ring-blue-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(roomId => {
            const lastData = getRoomData(roomId);
            const name = lastData?.senderName || "Unknown User";
            const subText = lastData?.displayNumber || roomId;

            return (
              <button key={roomId} onClick={() => setSelectedRoom(roomId)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === roomId ? 'bg-blue-600/10 border border-blue-600/20 shadow-inner' : 'bg-zinc-50 dark:bg-[#111] border border-transparent hover:border-white/5'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-600 text-white shadow-lg flex-shrink-0 text-lg">
                   {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className={`font-bold text-[14px] truncate ${selectedRoom === roomId ? 'text-blue-600' : 'text-zinc-700 dark:text-zinc-200'}`}>{name}</p>
                  <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">{subText}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl z-40">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-white font-black bg-blue-600 shadow-blue-600/20 shadow-lg">
                  {getRoomData(selectedRoom)?.senderName?.slice(0,1) || 'U'}
                </div>
                <div>
                   <h3 className="font-bold text-[14px] dark:text-white">{getRoomData(selectedRoom)?.senderName || "Unknown User"}</h3>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                     <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">MTProto Secure Link</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 scrollbar-hide">
              {messages.filter(m => (m.roomId === selectedRoom || m.senderNumber === selectedRoom)).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[80%] md:max-w-[65%] p-4 rounded-[1.8rem] text-[13.5px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-white/5'}`}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                    <div className={`text-[8px] mt-2 opacity-50 font-bold uppercase ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                      {formatTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <div className="absolute bottom-6 left-0 right-0 px-6 z-50">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2 rounded-full shadow-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-md">
                <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type encrypted message..." className="flex-1 bg-transparent px-5 outline-none dark:text-white text-sm font-medium" />
                <button type="submit" className="p-4 rounded-full bg-blue-600 text-white shadow-blue-600/40 shadow-xl hover:scale-105 active:scale-95 transition-all">
                  <Send size={18}/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
             <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center mb-8 animate-pulse">
                <Globe size={40} className="text-blue-600 opacity-30" />
             </div>
             <h3 className="text-xl font-black dark:text-white tracking-tighter uppercase italic opacity-40 italic">BaseKey Neural Core</h3>
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-3 text-zinc-500">Awaiting Secure Tunnel Selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramAPIInbox;
                                                                                                        
