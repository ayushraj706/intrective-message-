import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, User, Search, MoreVertical } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const userId = auth.currentUser?.uid;

  // 1. Real-time Messages Load karna
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);

      // Unique Rooms (Numbers) nikalna
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))];
      setRooms(uniqueNumbers);
      
      if (!selectedRoom && uniqueNumbers.length > 0) setSelectedRoom(uniqueNumbers[0]);
    });

    return () => unsubscribe();
  }, [userId]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // Message bhejne ka function
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

    setLoading(true);
    try {
      await axios.post('/api/send-message', {
        userId,
        to: selectedRoom,
        text: inputText
      });
      setInputText('');
    } catch (err) { alert("Sending failed!"); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Left Sidebar: Rooms List */}
      <div className="w-80 border-r border-zinc-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input placeholder="Search chat..." className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl py-2 pl-10 pr-4 text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.map(num => (
            <div 
              key={num} 
              onClick={() => setSelectedRoom(num)}
              className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${selectedRoom === num ? 'bg-blue-50 dark:bg-blue-600/10 border-r-4 border-blue-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-gray-800 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-tighter text-[10px]">
                {num.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white truncate">{num}</p>
                <p className="text-xs text-zinc-500 truncate">Tap to see messages</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"><User size={20}/></div>
                    <span className="font-bold dark:text-white">{selectedRoom}</span>
                </div>
                <MoreVertical size={20} className="text-zinc-500 cursor-pointer" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 dark:bg-[#050505]">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 dark:border-gray-800 flex gap-4">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-6 py-4 outline-none dark:text-white focus:border-blue-500 border border-transparent transition-all"
              />
              <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl text-white transition-all active:scale-90">
                {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
