import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, User, Search, MoreVertical, MessageSquare, Loader2, Check, ChevronLeft, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const userId = auth.currentUser?.uid;

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
      // मोबाइल पर ऑटो-सिलेक्ट नहीं करेंगे ताकि लिस्ट पहले दिखे
      if (window.innerWidth > 768 && !selectedRoom && uniqueNumbers.length > 0) {
        setSelectedRoom(uniqueNumbers[0]);
      }
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // --- टेक्स्ट मैसेज भेजना ---
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

  // --- मीडिया फाइल भेजना (Image/PDF) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;

    setFileLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('to', selectedRoom);

    try {
      // नोट: इसके लिए हमें एक अलग /api/send-media बनाना होगा
      await axios.post('/api/send-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      alert("Media send failed. Please check backend.");
    }
    setFileLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
      
      {/* 1. SIDEBAR (Mobile पर छुप जाएगा अगर चैट खुली है) */}
      <div className={`w-full md:w-80 border-r border-zinc-100 dark:border-zinc-800/50 flex flex-col bg-white dark:bg-[#0a0a0a] transition-all ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter mb-5">Chats</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-zinc-500" size={18} />
            <input placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none dark:text-white" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.map(num => (
            <div key={num} onClick={() => setSelectedRoom(num)}
              className={`p-4 mx-3 mb-1 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${selectedRoom === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs ${selectedRoom === num ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                {num.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{num}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-70">Active Now</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CHAT AREA (Mobile पर तब दिखेगा जब रूम सिलेक्ट हो) */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] transition-all ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header with Back Button for Mobile */}
            <div className="px-4 md:px-8 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3 bg-white/80 dark:bg-black/40 backdrop-blur-xl z-20">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white"><User size={20}/></div>
                    <span className="font-bold text-base dark:text-white truncate">{selectedRoom}</span>
                </div>
                <MoreVertical size={20} className="text-zinc-500 cursor-pointer" />
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[65%]`}>
                    <div className={`p-4 rounded-2xl text-[14px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-gray-800'}`}>
                      
                      {/* --- Media Rendering --- */}
                      {m.mediaType === 'image' && (
                        <img src={m.mediaUrl} alt="sent" className="rounded-lg mb-2 max-h-60 w-full object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(m.mediaUrl)} />
                      )}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl mb-2 cursor-pointer" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={24} className="text-blue-500" />
                          <span className="text-xs truncate font-medium">View Document</span>
                        </div>
                      )}
                      
                      {m.text && <p>{m.text}</p>}
                    </div>
                    <div className={`flex items-center gap-2 mt-1.5 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{formatTime(m.timestamp)}</span>
                       {m.sender === 'admin' && <Check size={10} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Bar with Media Button */}
            <div className="p-4 md:p-8 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800/50">
              <form onSubmit={sendMessage} className="flex items-center gap-3 md:gap-4 max-w-5xl mx-auto">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 md:p-4 text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-600/10 rounded-2xl transition-all">
                  {fileLoading ? <Loader2 className="animate-spin" size={24} /> : <Paperclip size={24} />}
                </button>
                
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-5 md:px-8 py-3.5 md:py-5 outline-none dark:text-white focus:ring-2 ring-blue-500/20 text-sm" />
                
                <button disabled={loading || fileLoading} className="bg-blue-600 hover:bg-blue-500 p-3.5 md:p-5 rounded-2xl text-white transition-all active:scale-90 shadow-lg shadow-blue-600/30">
                  {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center px-10">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800">
                <MessageSquare size={32} className="opacity-20 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">Welcome to BaseKey</h3>
            <p className="text-xs max-w-xs leading-relaxed">Select a chat to start real-time communication on WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
