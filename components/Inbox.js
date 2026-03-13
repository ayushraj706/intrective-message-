import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, User, Search, MoreVertical, MessageSquare, Loader2 } from 'lucide-react'; // <-- Icons Fix
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  // 1. User ID Safety Check
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  // 2. Real-time Messages Load (Only if userId exists)
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);

      // Unique Numbers (Rooms) nikalna
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean);
      setRooms(uniqueNumbers);
      
      if (!selectedRoom && uniqueNumbers.length > 0) setSelectedRoom(uniqueNumbers[0]);
    });

    return () => unsubscribe();
  }, [userId]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !userId) return;

    setLoading(true);
    try {
      await axios.post('/api/send-message', {
        userId,
        to: selectedRoom,
        text: inputText
      });
      setInputText('');
    } catch (err) { 
      console.error(err);
      alert("Message sending failed! Check API logs."); 
    }
    setLoading(false);
  };

  if (!userId) return <div className="h-screen flex items-center justify-center dark:text-white uppercase font-mono tracking-widest text-xs">Authenticating Ayus...</div>;

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* --- Left Sidebar: Chat Rooms --- */}
      <div className="w-80 border-r border-zinc-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white mb-4 tracking-tighter">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input placeholder="Search chat..." className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl py-2 pl-10 pr-4 text-sm outline-none dark:text-white" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.length > 0 ? rooms.map(num => (
            <div 
              key={num} 
              onClick={() => setSelectedRoom(num)}
              className={`p-5 flex items-center gap-4 cursor-pointer border-b border-zinc-50 dark:border-zinc-900/50 transition-all ${selectedRoom === num ? 'bg-blue-50 dark:bg-blue-600/10 border-r-4 border-blue-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-gray-800 flex items-center justify-center text-zinc-500 font-bold text-[10px] uppercase">
                {num.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white truncate">{num}</p>
                <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest">Active WhatsApp</p>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-zinc-500 text-xs">No active chats found.</div>
          )}
        </div>
      </div>

      {/* --- Right Pane: Chat Window --- */}
      <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-[#050505]">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"><User size={18}/></div>
                    <span className="font-bold dark:text-white">{selectedRoom}</span>
                </div>
                <MoreVertical size={20} className="text-zinc-500 cursor-pointer" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-6 border-t border-zinc-200 dark:border-gray-800 flex gap-4 bg-white dark:bg-black">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your reply..." 
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-6 py-4 outline-none dark:text-white focus:border-blue-500 border border-transparent transition-all shadow-inner"
              />
              <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl text-white transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="opacity-20" />
            </div>
            <p className="text-sm font-medium tracking-tight">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
