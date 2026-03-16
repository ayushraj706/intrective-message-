import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, Globe, Loader2, ChevronLeft } from 'lucide-react';
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

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter only Telegram API messages
      const filteredMsgs = allMsgs.filter(m => m.platform === 'telegram-api');
      setMessages(filteredMsgs);

      // Unique Rooms based on ID (senderNumber)
      const uniqueIds = [...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueIds);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedRoom]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    
    const textToSend = inputText;
    setInputText('');

    try {
      // selectedRoom yahan hamesha 'roomId' (Telegram ID) hogi
      await axios.post('/api/send-telegram-client', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { 
      toast.error("Message delivery failed!"); 
    }
  };

  const formatTime = (ts) => ts?.toDate ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  // Current chat user info nikalne ke liye helper
  const getChatInfo = (roomId) => {
    return messages.findLast(m => m.senderNumber === roomId);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      
      {/* SIDEBAR: List of chats */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-600">
                <Globe size={16} />
            </div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter italic">Telegram <span className="text-blue-600">Neural</span></h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search linked chats..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white transition-all focus:ring-1 focus:ring-blue-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(num => {
            const chatInfo = getChatInfo(num);
            const displayName = chatInfo?.senderName || "Unknown User";
            const displaySub = chatInfo?.displayNumber || num;

            return (
              <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-zinc-50 dark:bg-[#111] border border-transparent hover:border-white/5'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-600 text-white shadow-lg flex-shrink-0">
                   {displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className={`font-bold text-[13.5px] truncate ${selectedRoom === num ? 'text-blue-600' : 'text-zinc-700 dark:text-zinc-200'}`}>{displayName}</p>
                  <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">{displaySub}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CHAT AREA: Messages */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl z-40">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-white font-black bg-blue-600 shadow-blue-600/20 shadow-lg">
                  {getChatInfo(selectedRoom)?.senderName?.slice(0,1) || 'TG'}
                </div>
                <div>
                   <h3 className="font-bold text-[14px] dark:text-white">{getChatInfo(selectedRoom)?.senderName || "Unknown User"}</h3>
                   <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Secure MTProto Tunnel</p>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[80%] md:max-w-[65%] p-4 rounded-[1.8rem] text-[13.5px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-white/5'}`}>
                    {m.text}
                    <div className={`text-[9px] mt-2 opacity-60 flex items-center gap-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      {formatTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Floating Input */}
            <div className="absolute bottom-6 left-0 right-0 px-6 z-50">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2 rounded-full shadow-2xl border border-zinc-200 dark:border-white/10">
                <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type a secure message..." className="flex-1 bg-transparent px-5 outline-none dark:text-white text-sm" />
                <button type="submit" className="p-4 rounded-full bg-blue-600 text-white shadow-blue-600/40 shadow-xl hover:scale-105 active:scale-95 transition-all">
                  <Send size={18}/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
             <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center mb-8 animate-pulse">
                <Globe size={40} className="text-blue-600 opacity-40" />
             </div>
             <h3 className="text-xl font-black dark:text-white tracking-tighter uppercase italic opacity-60">BaseKey Neural Core</h3>
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-3 text-zinc-500">Awaiting Connection Selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramAPIInbox;
