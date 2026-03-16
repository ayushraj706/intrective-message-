import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, Globe, Loader2, CheckCheck, Clock, ChevronLeft, Paperclip, FileText } from 'lucide-react';
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
    
    // Yahan selectedRoom hamesha asli ID (+ ya BigInt wali) hogi
    const textToSend = inputText;
    setInputText('');

    try {
      await axios.post('/api/send-telegram-client', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { toast.error("Client API message failed!"); }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      {/* SIDEBAR */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Inboxes
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-blue-600">
                <Globe size={16} />
            </div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter capitalize italic">
              Telegram <span className="text-blue-600">Client API</span>
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(num => {
            // Room ka naam nikalne ka logic
            const lastMsg = messages.findLast(m => m.senderNumber === num);
            const displayName = lastMsg?.senderName || num;

            return (
              <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-zinc-50 dark:bg-[#111] border border-transparent'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-600 text-white shadow-inner">
                   {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className={`font-bold text-[13px] truncate ${selectedRoom === num ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{displayName}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-zinc-500">{num}</p>
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
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-white font-black bg-blue-600">TG</div>
                <div>
                   <h3 className="font-bold text-[13px] dark:text-white">{messages.findLast(m => m.senderNumber === selectedRoom)?.senderName || selectedRoom}</h3>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[1.8rem] text-[13.5px] max-w-[70%] ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Form bilkul waisa hi rahega */}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">Select a chat</div>
        )}
      </div>
    </div>
  );
};

export default TelegramAPIInbox;
                                                                         
