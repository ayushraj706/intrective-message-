import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, CheckCheck, Clock, ChevronLeft, Paperclip, FileText, ImageIcon } from 'lucide-react';
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

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  // Cloudinary Config
  const CLOUD_NAME = "dprbizfao";
  const UPLOAD_PRESET = "ayush_social";

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueNumbers);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // 1. Text Message Bhejna
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !currentUserId) return;

    const textToSend = inputText;
    const cleanNumber = selectedRoom.replace(/\D/g, ''); 
    
    const tempId = Date.now().toString();
    const tempMsg = {
        id: tempId,
        text: textToSend,
        sender: 'admin',
        senderNumber: selectedRoom,
        timestamp: { toDate: () => new Date() },
        status: 'sending' 
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      await axios.post('/api/send-message', { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { console.error("Send Error:", err); }
  };

  // 2. Media Upload & Send (Cloudinary Integration)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;

    setFileLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      // Step 1: Cloudinary par upload
      const cl_res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, formData);
      const mediaUrl = cl_res.data.secure_url;
      const mediaType = file.type.startsWith('image') ? 'image' : 'document';

      // Step 2: Backend ke zariye WhatsApp par bhejna
      const cleanNumber = selectedRoom.replace(/\D/g, '');
      await axios.post('/api/send-media', { userId: currentUserId, to: cleanNumber, mediaUrl, mediaType });
      
    } catch (err) {
      console.error("Media Error:", err);
      alert("Media send fail ho gaya!");
    }
    setFileLoading(false);
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
            <input placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {rooms.map(num => (
            <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-50 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-gray-800 flex-shrink-0">
                {/* Official DP Yahan load hogi backend se */}
                <img src={`https://ui-avatars.com/api/?name=${num}&background=random`} alt="dp" className="w-full h-full object-cover" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm truncate">{num}</p>
                <p className="text-[10px] opacity-60">Online</p>
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
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500 transition-transform active:scale-90"><ChevronLeft size={24} /></button>
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
                    <div className={`p-3 rounded-2xl text-[14px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-white/5'}`}>
                      
                      {/* --- Media Rendering (RE-ADDED) --- */}
                      {m.mediaType === 'image' && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          <img src={m.mediaUrl} alt="sent" className="w-full max-h-72 object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(m.mediaUrl)} />
                        </div>
                      )}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl mb-2 cursor-pointer" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={20} className="text-blue-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate">Open Document</span>
                        </div>
                      )}
                      {/* --- Text Rendering --- */}
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    </div>

                    {/* Meta Data (Time + Status) */}
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-zinc-400 font-bold">{formatTime(m.timestamp)}</span>
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

            {/* Input Form */}
            <div className="absolute bottom-6 left-0 right-0 px-6">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-full border border-zinc-100 dark:border-white/5 shadow-xl transition-all">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 text-zinc-400 hover:text-blue-500 transition-colors" disabled={fileLoading}>
                  {fileLoading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                </button>
                <input 
                  type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent py-2 px-1 outline-none dark:text-white text-sm" 
                />
                <button className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-600/20 active:scale-90 transition-all hover:bg-blue-500">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
             <MessageSquare size={50} className="opacity-10 mb-4" />
             <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-30">Select a Chat to Begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
                        
