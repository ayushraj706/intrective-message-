import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const TelegramBotInbox = ({ onBack }) => {
  const platform = 'telegram';
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
      const filteredMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.platform === 'telegram');
      setMessages(filteredMsgs);
      setRooms([...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse());
    });
    return () => unsubscribe();
  }, [currentUserId]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    const textToSend = inputText;
    setInputText('');
    try {
      await axios.post('/api/send-telegram', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { toast.error("Bot message failed!"); }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      {/* Sidebar - Same logic as API, just use bg-blue-400 and icon Send */}
      <div className={`w-full md:w-96 border-r border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-6">
            <button onClick={onBack} className="text-zinc-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Back</button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-400"><Send size={16} /></div>
              <h2 className="text-2xl font-black dark:text-white tracking-tighter italic">Telegram <span className="text-blue-400">Bot</span></h2>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {rooms.map(num => {
               const lastMsg = messages.findLast(m => m.senderNumber === num);
               return (
                 <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-400/10 border border-blue-400/20' : 'bg-zinc-50 dark:bg-[#111]'}`}>
                    <div className="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold">{lastMsg?.senderName?.slice(0,1) || 'B'}</div>
                    <div className="text-left"><p className="font-bold text-[13px] dark:text-white">{lastMsg?.senderName || num}</p></div>
                 </button>
               )
            })}
         </div>
      </div>
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505]">
          {selectedRoom ? (
            <div className="flex flex-col h-full">
               <div className="p-4 border-b border-white/5 bg-black/60 backdrop-blur-xl"><h3 className="font-bold dark:text-white">{selectedRoom}</h3></div>
               <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.filter(m => m.senderNumber === selectedRoom).map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-2xl max-w-[70%] ${m.sender === 'admin' ? 'bg-blue-400 text-white' : 'bg-zinc-900 text-white'}`}>{m.text}</div></div>
                  ))}
               </div>
               <form onSubmit={sendMessage} className="p-6 bg-transparent"><div className="bg-zinc-900 p-2 rounded-full flex gap-2"><input value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 bg-transparent px-4 text-white outline-none" /><button className="p-3 bg-blue-400 rounded-full text-white"><Send size={18}/></button></div></form>
            </div>
          ) : <div className="m-auto text-zinc-500 uppercase font-bold text-[10px]">Select Bot Chat</div>}
      </div>
    </div>
  );
};

export default TelegramBotInbox;
