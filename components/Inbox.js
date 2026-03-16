import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, ChevronLeft, Paperclip, FileText, User } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef();

  // Sabse pehle identity pakdo (Auth ya LocalStorage se)
  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  const CLOUD_NAME = "dprbizfao";
  const UPLOAD_PRESET = "ayush_social";

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ""; }
  };

  // 1. Rooms Load Karna
  useEffect(() => {
    if (!currentUserId) return;
    setRoomsLoading(true);
    
    // Yahan hum messages collection se unique numbers nikalte hain
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean);
      setRooms(uniqueNumbers);
      setRoomsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // 2. Message Bhejna (FIXED FOR 400 ERROR)
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !currentUserId) return;
    
    setLoading(true);
    try {
      // Logic Fix: Ensure number format is correct (Remove any '+' or spaces)
      const cleanNumber = selectedRoom.replace(/\D/g, ''); 
      
      const response = await axios.post('/api/send-message', { 
        userId: currentUserId, 
        to: cleanNumber, 
        text: inputText 
      });

      if (response.status === 200) {
        setInputText('');
      }
    } catch (err) {
      console.error("400 Error Details:", err.response?.data);
      alert(`Message fail! Check if number ${selectedRoom} is valid.`);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;
    setFileLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const cl_res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, formData);
      const mediaUrl = cl_res.data.secure_url;
      const mediaType = file.type.startsWith('image') ? 'image' : 'document';
      
      const cleanNumber = selectedRoom.replace(/\D/g, '');
      await axios.post('/api/send-media', { userId: currentUserId, to: cleanNumber, mediaUrl, mediaType });
      alert("Media sent successfully!");
    } catch (err) {
      alert("Media upload fail!");
    }
    setFileLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden transition-colors duration-500">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-80 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] transition-all ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-3xl font-black dark:text-white tracking-tighter mb-5 italic">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search conversations..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-blue-500/20 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-20">
          {roomsLoading ? (
            // Skeleton Loader for Professional Look
            [1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : rooms.length > 0 ? rooms.map(num => (
            <button 
              key={num} 
              onClick={() => setSelectedRoom(num)} 
              className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all group ${selectedRoom === num ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[0.98]' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-900 dark:text-zinc-400'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${selectedRoom === num ? 'bg-white/20' : 'bg-gradient-to-tr from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900'}`}>
                {num.slice(-2)}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm tracking-tight">{num}</p>
                <p className={`text-[10px] truncate opacity-60 ${selectedRoom === num ? 'text-white' : 'text-zinc-500'}`}>Click to view chat</p>
              </div>
            </button>
          )) : (
            <div className="p-10 text-center opacity-30 flex flex-col items-center gap-2">
              <MessageSquare size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Chats Available</p>
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl z-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-600/20">B</div>
                <div>
                    <h3 className="font-bold text-sm dark:text-white">{selectedRoom}</h3>
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">● Active Channel</p>
                </div>
              </div>
              <MoreVertical size={20} className="text-zinc-400 cursor-pointer hover:text-blue-500 transition-colors" />
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-6 pb-24 scrollbar-hide">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[60%] group`}>
                    <div className={`p-4 rounded-[1.8rem] text-[13.5px] shadow-sm leading-relaxed transition-all ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-white/5'}`}>
                      {m.mediaType === 'image' && (
                        <img src={m.mediaUrl} alt="media" className="rounded-2xl mb-3 w-full object-cover max-h-80 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(m.mediaUrl)} />
                      )}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-4 rounded-2xl mb-3 cursor-pointer hover:bg-black/20" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={24} className="text-blue-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate italic">Download Document</span>
                        </div>
                      )}
                      {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                    </div>
                    <div className={`flex items-center gap-2 mt-2 px-2 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[8px] text-zinc-400 font-black uppercase tracking-tighter">{formatTime(m.timestamp)}</span>
                      {m.sender === 'admin' && <Check size={12} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Footer */}
            <div className="absolute bottom-6 left-0 right-0 px-6 z-50">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2 rounded-[2.2rem] border border-zinc-200 dark:border-white/10 shadow-2xl backdrop-blur-xl">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-3.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all" disabled={fileLoading}>
                  {fileLoading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                </button>
                <input 
                    type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} 
                    placeholder="Write something..." 
                    className="flex-1 bg-transparent py-3 px-2 outline-none dark:text-white text-sm" 
                />
                <button disabled={loading || fileLoading} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-full text-white transition-all shadow-xl shadow-blue-600/20 active:scale-90">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-white dark:bg-[#111] rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-zinc-100 dark:border-white/5 animate-bounce">
              <MessageSquare size={36} className="text-blue-500 opacity-40" />
            </div>
            <div>
                <h3 className="text-xl font-black dark:text-white italic tracking-tighter">BASEKEY NEURAL INBOX</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Ready for encrypted transmission</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
  
