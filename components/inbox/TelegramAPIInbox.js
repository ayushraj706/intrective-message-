import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, Globe, Loader2, CheckCheck, Clock, ChevronLeft, Paperclip } from 'lucide-react';
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
      const filteredMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                           .filter(m => m.platform === 'telegram-api');
      setMessages(filteredMsgs);
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
      await axios.post('/api/send-telegram-client', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { toast.error("Client API message failed!"); }
  };

  const formatTime = (ts) => ts?.toDate ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Back</button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-600"><Globe size={16} /></div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter italic">Telegram <span className="text-blue-600">API</span></h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search API chats..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none dark:text-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map(num => {
            const lastMsg = messages.findLast(m => m.senderNumber === num);
            const displayName = lastMsg?.senderName || num;
            return (
              <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-zinc-50 dark:bg-[#111] border border-transparent'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-600 text-white shadow-lg">{displayName.slice(0, 2).toUpperCase()}</div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className="font-bold text-[13px] dark:text-white truncate">{displayName}</p>
                  <p className="text-[9px] text-zinc-500 truncate mt-1">{num}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">TG</div>
                <h3 className="font-bold text-[13px] dark:text-white">{messages.findLast(m => m.senderNumber === selectedRoom)?.senderName || selectedRoom}</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-3xl text-[13.5px] max-w-[75%] ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-white/5'}`}>
                    {m.text}
                    <div className="text-[9px] mt-2 opacity-60 text-right">{formatTime(m.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="absolute bottom-6 left-0 right-0 px-6">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2 rounded-full shadow-2xl border border-white/10">
                <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent px-4 outline-none dark:text-white" />
                <button className="p-4 rounded-full bg-blue-600 text-white shadow-blue-600/20 shadow-xl"><Send size={18}/></button>
              </form>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-xs italic">Select a conversation to start messaging</div>}
      </div>
    </div>
  );
};

export default TelegramAPIInbox;
                
