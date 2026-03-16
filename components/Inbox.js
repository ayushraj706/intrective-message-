import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, CheckCheck, Clock, ChevronLeft, Paperclip, FileText } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const scrollRef = useRef();
  const fileInputRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  // 1. Messages & Rooms Listener (Ordering Fix)
  useEffect(() => {
    if (!currentUserId) return;
    setRoomsLoading(true);

    // Order by 'asc' taaki naye messages niche aayein
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      
      // Rooms ko hamesha latest message ke hisab se upar dikhane ke liye
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueNumbers);
      setRoomsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // 2. Smart Send Logic (Clock Icon Fix)
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !currentUserId) return;

    const textToSend = inputText;
    const cleanNumber = selectedRoom.replace(/\D/g, ''); 
    
    // Optimistic Update: Server par jaane se pehle hi screen par dikhao
    const tempId = Date.now().toString();
    const tempMsg = {
        id: tempId,
        text: textToSend,
        sender: 'admin',
        senderNumber: selectedRoom,
        timestamp: { toDate: () => new Date() }, // Fake timestamp for UI
        status: 'sending' // Isse ghari (clock) dikhegi
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText(''); // Turant input khali karo

    try {
      await axios.post('/api/send-message', { 
        userId: currentUserId, 
        to: cleanNumber, 
        text: textToSend 
      });
      // Server se save hone par Firestore listener apne aap 'tempMsg' ko asli message se replace kar dega
    } catch (err) {
      console.error("Send Fail:", err);
      // Agar fail hua toh temp message hata sakte ho ya error dikha sakte ho
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ""; }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden transition-colors duration-500">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-80 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] transition-all ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-3xl font-black dark:text-white tracking-tighter mb-5 italic">BaseKey</h2>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {rooms.map(num => (
            <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600 text-white' : 'hover:bg-zinc-50 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
              {/* DP Slot: Yahan Official DP aayegi */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                {/* Agar aapke database mein 'photo' field hai toh ise use karein */}
                <img src={`https://ui-avatars.com/api/?name=${num}&background=random`} alt="dp" className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{num}</p>
                <p className="text-[10px] opacity-60">Tap to chat</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-xl z-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">B</div>
                <h3 className="font-bold text-sm dark:text-white">{selectedRoom}</h3>
              </div>
              <MoreVertical size={20} className="text-zinc-400" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    <div className={`p-3.5 rounded-2xl text-[14px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-zinc-400 font-bold">{formatTime(m.timestamp)}</span>
                      
                      {/* STATUS ICONS LOGIC */}
                      {m.sender === 'admin' && (
                        <span className="transition-all">
                          {m.status === 'sending' ? (
                            <Clock size={10} className="text-zinc-400 animate-pulse" />
                          ) : m.status === 'read' ? (
                            <CheckCheck size={12} className="text-blue-400" />
                          ) : m.status === 'delivered' ? (
                            <CheckCheck size={12} className="text-zinc-400" />
                          ) : (
                            <Check size={12} className="text-zinc-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="absolute bottom-6 left-0 right-0 px-6">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-full border border-zinc-100 dark:border-white/5 shadow-xl">
                <button type="button" className="p-3 text-zinc-400"><Paperclip size={20} /></button>
                <input 
                  type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent py-2 px-1 outline-none dark:text-white text-sm" 
                />
                <button className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-600/20 active:scale-90 transition-all">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
             <MessageSquare size={50} className="opacity-10 mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest">Select a Chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
                      
