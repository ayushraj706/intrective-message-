import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MessageSquare, Globe, ChevronLeft, Paperclip, Loader2, CheckCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const InboxBase = ({ platform, themeColor, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();
  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  const config = {
    green: { bg: 'bg-green-600', text: 'text-green-500', icon: <MessageSquare size={16}/> },
    'blue-bot': { bg: 'bg-blue-400', text: 'text-blue-400', icon: <Send size={16}/> },
    'blue-api': { bg: 'bg-blue-600', text: 'text-blue-600', icon: <Globe size={16}/> }
  }[themeColor];

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allMsgs.filter(m => platform === 'whatsapp' ? (!m.platform || m.platform === 'whatsapp') : m.platform === platform);
      setMessages(filtered);
      const unique = [...new Set(filtered.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(unique);
    });
  }, [currentUserId, platform]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const apiMap = { whatsapp: '/api/send-message', telegram: '/api/send-telegram', 'telegram-api': '/api/send-telegram-client' };
    try {
      const to = selectedRoom;
      setInputText('');
      await axios.post(apiMap[platform], { userId: currentUserId, to, text: inputText });
    } catch (err) { toast.error("Failed to send"); }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      {/* Sidebar logic using config.bg and config.text */}
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${config.bg}`}>{config.icon}</div>
             <h2 className="text-xl font-black dark:text-white uppercase italic">{platform}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map(num => {
            const lastMsg = messages.findLast(m => m.senderNumber === num);
            return (
              <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl text-left transition-all ${selectedRoom === num ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}>
                <p className="font-bold text-sm dark:text-white truncate">{lastMsg?.senderName || num}</p>
                <p className="text-[10px] text-zinc-500 truncate">{lastMsg?.displayNumber || num}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat logic */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-black/60 backdrop-blur-xl">
               <h3 className="font-bold dark:text-white">{messages.findLast(m => m.senderNumber === selectedRoom)?.senderName || selectedRoom}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[1.5rem] max-w-[70%] text-sm ${m.sender === 'admin' ? `${config.bg} text-white rounded-tr-none` : 'bg-white dark:bg-zinc-900 dark:text-white rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="absolute bottom-6 left-0 right-0 px-6">
              <form onSubmit={handleSend} className="bg-white dark:bg-[#111] p-2 rounded-full flex gap-2 border border-zinc-200 dark:border-white/10 shadow-2xl">
                <input value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 bg-transparent px-4 outline-none dark:text-white" placeholder="Type message..." />
                <button className={`p-3 rounded-full text-white ${config.bg}`}><Send size={18}/></button>
              </form>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-zinc-500">Select a conversation</div>}
      </div>
    </div>
  );
};

export default InboxBase;
              
