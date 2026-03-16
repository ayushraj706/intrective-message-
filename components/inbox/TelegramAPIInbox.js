// Components/inbox/TelegramAPIInbox.js ko isse update karein

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

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredMsgs = allMsgs.filter(m => m.platform === 'telegram-api');
      
      setMessages(filteredMsgs);

      // Unique Rooms Fix: SenderNumber aur RoomId dono ko check karo
      const uniqueIds = [...new Set(filteredMsgs.map(m => m.senderNumber || m.roomId))].filter(Boolean).reverse();
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
      await axios.post('/api/send-telegram-client', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { toast.error("Transmission failed!"); }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper: Naam nikalne ke liye poori chat check karo (fallback fix)
  const getRoomData = (roomId) => {
    const roomMsgs = messages.filter(m => m.senderNumber === roomId || m.roomId === roomId);
    const lastWithInfo = [...roomMsgs].reverse().find(m => m.senderName && m.senderName !== "Telegram User");
    return lastWithInfo || roomMsgs[roomMsgs.length - 1];
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Dashboard</button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-600 shadow-lg"><Globe size={16} /></div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter italic uppercase">Neural <span className="text-blue-600">Core</span></h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(roomId => {
            const data = getRoomData(roomId);
            const name = data?.senderName || "Unknown User";
            const number = data?.displayNumber || roomId;

            return (
              <button key={roomId} onClick={() => setSelectedRoom(roomId)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === roomId ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-zinc-50 dark:bg-[#111] border border-transparent'}`}>
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                   {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className={`font-bold text-[14px] truncate ${selectedRoom === roomId ? 'text-blue-600' : 'text-zinc-700 dark:text-zinc-200'}`}>{name}</p>
                  <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">{number}</p>
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
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-black/60 backdrop-blur-2xl">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <h3 className="font-bold text-[14px] dark:text-white">{getRoomData(selectedRoom)?.senderName || "Unknown User"}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom || m.roomId === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-[13.5px] ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-white/5'}`}>
                    <p>{m.text}</p>
                    <div className="text-[8px] mt-2 opacity-40 text-right">{formatTime(m.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-6">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2 rounded-full shadow-2xl border border-white/10">
                <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type encrypted message..." className="flex-1 bg-transparent px-5 outline-none dark:text-white text-sm" />
                <button type="submit" className="p-4 rounded-full bg-blue-600 text-white shadow-xl"><Send size={18}/></button>
              </form>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse italic">Awaiting secure connection...</div>}
      </div>
    </div>
  );
};

export default TelegramAPIInbox;
