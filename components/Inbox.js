import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, CheckCheck, Clock, ChevronLeft, Paperclip, FileText, ImageIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner'; // Sonner import kiya gaya

// 'platform' prop default 'whatsapp' hai, par 'telegram' bhi ho sakta hai
const Inbox = ({ platform = 'whatsapp', onBack }) => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');
  const CLOUD_NAME = "dprbizfao";
  const UPLOAD_PRESET = "ayush_social";

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Platform ke hisaab se messages filter karna
      const filteredMsgs = allMsgs.filter(m => {
        if (platform === 'whatsapp') return !m.platform || m.platform === 'whatsapp';
        if (platform === 'telegram') return m.platform === 'telegram';
        return false;
      });

      setMessages(filteredMsgs);
      const uniqueNumbers = [...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueNumbers);
    });
    
    return () => unsubscribe();
  }, [currentUserId, platform]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  // --- TEXT MESSAGE SENDING ---
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      toast.warning("Khali message nahi bhej sakte!"); // Toast UI
      return;
    }
    if (!selectedRoom || !currentUserId) return;

    const textToSend = inputText;
    // WhatsApp mein country code aur + hatana zaroori hai, Telegram ID numbers hoti hain
    const cleanNumber = platform === 'telegram' ? selectedRoom : selectedRoom.replace(/\D/g, ''); 
    
    const tempMsg = {
        id: `temp-${Date.now()}`,
        text: textToSend,
        sender: 'admin',
        senderNumber: selectedRoom,
        platform: platform, // Naya tag
        timestamp: { toDate: () => new Date() },
        status: 'sending' 
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      const apiUrl = platform === 'telegram' ? '/api/send-telegram' : '/api/send-message';
      await axios.post(apiUrl, { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { 
      console.error("Send Error", err);
      toast.error(`Message failed to send via ${platform.toUpperCase()}`); // Error aane par Toast
    }
  };

  // --- MEDIA SENDING ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;

    setFileLoading(true);
    toast.info("Media processing started...", { duration: 2000 }); // Upload start hone par info

    const cleanNumber = platform === 'telegram' ? selectedRoom : selectedRoom.replace(/\D/g, '');
    const mediaType = file.type.startsWith('image') ? 'image' : 'document';
    
    const localPreviewUrl = URL.createObjectURL(file);
    const tempMsg = {
        id: `temp-${Date.now()}`,
        mediaUrl: localPreviewUrl,
        mediaType: mediaType,
        sender: 'admin',
        senderNumber: selectedRoom,
        platform: platform,
        timestamp: { toDate: () => new Date() },
        status: 'sending'
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const cl_res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, formData);
      const finalMediaUrl = cl_res.data.secure_url;

      // Note: Media sending currently setup for WhatsApp mostly, 
      // telegram media API needs `sendPhoto` endpoint if platform is telegram. 
      // Assuming api/send-media handles both or we fallback.
      const apiUrl = platform === 'telegram' ? '/api/send-telegram' : '/api/send-media';
      
      // If Telegram, we might need a dedicated media endpoint, but using generic for now
      await axios.post(apiUrl, { userId: currentUserId, to: cleanNumber, mediaUrl: finalMediaUrl, mediaType });
      
      toast.success("Media sent successfully!"); // Success Toast
    } catch (err) {
      console.error("Media Send Error", err);
      toast.error("Failed to send media file."); // Error Toast
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
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Inboxes
          </button>
          <h2 className="text-3xl font-black dark:text-white tracking-tighter mb-5 capitalize italic">
            {platform} <span className="text-blue-500">Inbox</span>
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
          {rooms.map(num => (
            <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-50 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
              <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 font-bold ${platform === 'telegram' ? 'bg-blue-400 text-white' : 'bg-green-500 text-white'}`}>
                 {platform === 'telegram' ? 'TG' : num.slice(0, 2)}
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">{num}</p>
                <p className="text-[9px] opacity-60 font-black uppercase tracking-widest">{platform}</p>
              </div>
            </button>
          ))}
          {rooms.length === 0 && (
             <div className="p-10 text-center opacity-30 font-bold text-[10px] uppercase tracking-widest">
               No messages in {platform} yet
             </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-xl z-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg ${platform === 'telegram' ? 'bg-blue-400 shadow-blue-400/20' : 'bg-green-500 shadow-green-500/20'}`}>
                  {platform === 'telegram' ? 'TG' : 'WA'}
                </div>
                <div>
                   <h3 className="font-bold text-sm dark:text-white truncate max-w-[200px]">{selectedRoom}</h3>
                   <p className={`text-[8px] font-bold uppercase tracking-widest animate-pulse ${platform === 'telegram' ? 'text-blue-400' : 'text-green-500'}`}>
                     {platform} Active Link
                   </p>
                </div>
              </div>
              <MoreVertical size={20} className="text-zinc-400 cursor-pointer" />
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className="max-w-[85%] md:max-w-[70%]">
                    <div className={`p-3.5 rounded-2xl text-[14px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-white/5'}`}>
                      {m.mediaType === 'image' && (
                        <div className="mb-1 rounded-xl overflow-hidden shadow-inner bg-black/5">
                          <img src={m.mediaUrl} alt="media" className="w-full max-h-80 object-cover cursor-pointer hover:scale-105 transition-transform duration-500" onClick={() => window.open(m.mediaUrl)} />
                        </div>
                      )}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl mb-1 cursor-pointer" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={20} className="text-blue-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate">Secure Document</span>
                        </div>
                      )}
                      {m.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
                    </div>

                    {/* STATUS ICONS LOGIC */}
                    <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase">{formatTime(m.timestamp)}</span>
                      {m.sender === 'admin' && (
                        <span className="transition-all">
                          {m.status === 'sending' ? (
                            <Clock size={10} className="text-zinc-400 animate-pulse" />
                          ) : m.status === 'read' ? (
                            <CheckCheck size={13} className="text-blue-500" />
                          ) : m.status === 'delivered' ? (
                            <CheckCheck size={13} className="text-zinc-400" />
                          ) : (
                            <Check size={11} className="text-zinc-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-6 z-50">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-white dark:bg-[#111] p-2.5 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-2xl backdrop-blur-xl">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={fileLoading} className="p-3 text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all">
                  {fileLoading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                </button>
                <input 
                  type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} 
                  placeholder={`Message via ${platform}...`}
                  className="flex-1 bg-transparent py-2 px-1 outline-none dark:text-white text-sm" 
                />
                <button disabled={loading || fileLoading} className="bg-blue-600 hover:bg-blue-500 p-3.5 rounded-full text-white shadow-xl shadow-blue-600/20 active:scale-90 transition-all">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-center p-10">
             <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner animate-pulse">
                <MessageSquare size={40} className={`opacity-20 ${platform === 'telegram' ? 'text-blue-400' : 'text-green-500'}`} />
             </div>
             <h3 className="text-xl font-black dark:text-white italic tracking-tighter uppercase">Base<span className={platform === 'telegram' ? 'text-blue-400' : 'text-green-500'}>Key</span> Control</h3>
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-3 opacity-40">Awaiting {platform} selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
    
