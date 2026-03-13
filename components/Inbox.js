import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, User, Search, MoreVertical, MessageSquare, Loader2, Check } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const userId = auth.currentUser?.uid;

  // Time format karne ka function (e.g. 10:22 PM)
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean);
      setRooms(uniqueNumbers);
      if (!selectedRoom && uniqueNumbers.length > 0) setSelectedRoom(uniqueNumbers[0]);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    setLoading(true);
    try {
      await axios.post('/api/send-message', { userId, to: selectedRoom, text: inputText });
      setInputText('');
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] transition-all duration-500">
      {/* Sidebar */}
      <div className="w-85 border-r border-zinc-100 dark:border-zinc-800/50 flex flex-col bg-white dark:bg-[#0a0a0a]">
        <div className="p-7">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter mb-5">Chats</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input placeholder="Search conversations..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-blue-500/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all dark:text-white" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rooms.map(num => (
            <div key={num} onClick={() => setSelectedRoom(num)}
              className={`p-5 mx-3 mb-1 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${selectedRoom === num ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs ${selectedRoom === num ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                {num.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-sm truncate">{num}</p>
                </div>
                <p className={`text-[11px] truncate uppercase tracking-widest font-medium opacity-70`}>WhatsApp Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505]">
        {selectedRoom ? (
          <>
            <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center bg-white/80 dark:bg-black/40 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><User size={22}/></div>
                    <div>
                      <span className="font-bold text-lg dark:text-white block tracking-tight">{selectedRoom}</span>
                      <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online</span>
                    </div>
                </div>
                <button className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all text-zinc-500"><MoreVertical size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[65%] group`}>
                    <div className={`p-4 rounded-[1.5rem] text-[14px] shadow-sm leading-relaxed ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/10' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-gray-800'}`}>
                      {m.text}
                    </div>
                    <div className={`flex items-center gap-2 mt-2 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{formatTime(m.timestamp)}</span>
                       {m.sender === 'admin' && <Check size={10} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-8 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/50">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-4">
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Write your response..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-[1.5rem] px-8 py-5 outline-none dark:text-white focus:ring-2 ring-blue-500/20 border border-transparent transition-all shadow-inner text-sm" />
                <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-5 rounded-[1.5rem] text-white transition-all active:scale-95 shadow-xl shadow-blue-600/30 flex items-center justify-center min-w-[64px]">
                  {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center px-10">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900/50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-200/50 dark:border-zinc-800 transition-transform hover:scale-110">
                <MessageSquare size={44} className="opacity-20 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2 tracking-tight">Select a conversation</h3>
            <p className="text-sm max-w-xs leading-relaxed">Choose a message from the left to start communicating with your customers in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
