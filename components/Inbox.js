import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, CheckCheck, Clock, ChevronLeft, Paperclip, FileText, Globe } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

  // --- THEME / COLOR SETUP BASED ON PLATFORM ---
  const getPlatformColors = () => {
    if (platform === 'whatsapp') return { primary: 'bg-green-600', hover: 'hover:bg-green-500', text: 'text-green-500', shadow: 'shadow-green-600/20', lightBg: 'bg-green-500/10', border: 'border-green-500/20' };
    if (platform === 'telegram') return { primary: 'bg-blue-400', hover: 'hover:bg-blue-500', text: 'text-blue-400', shadow: 'shadow-blue-400/20', lightBg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    if (platform === 'telegram-api') return { primary: 'bg-blue-600', hover: 'hover:bg-blue-500', text: 'text-blue-600', shadow: 'shadow-blue-600/20', lightBg: 'bg-blue-600/10', border: 'border-blue-600/20' };
    return { primary: 'bg-zinc-600', hover: 'hover:bg-zinc-500', text: 'text-zinc-500', shadow: 'shadow-zinc-600/20', lightBg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
  };
  const colors = getPlatformColors();

  const getPlatformIcon = (size = 16, props = {}) => {
    if (platform === 'whatsapp') return <MessageSquare size={size} {...props} />;
    if (platform === 'telegram') return <Send size={size} className="-ml-0.5" {...props} />;
    if (platform === 'telegram-api') return <Globe size={size} {...props} />;
    return <MessageSquare size={size} {...props} />;
  };

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filteredMsgs = allMsgs.filter(m => {
        if (platform === 'whatsapp') return !m.platform || m.platform === 'whatsapp';
        return m.platform === platform;
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
      toast.warning("Khali message nahi bhej sakte!"); 
      return;
    }
    if (!selectedRoom || !currentUserId) return;

    const textToSend = inputText;
    // Sirf WhatsApp ke liye non-digits hatayenge (country code handle karne ke liye)
    const cleanNumber = platform === 'whatsapp' ? selectedRoom.replace(/\D/g, '') : selectedRoom; 
    
    const tempMsg = {
        id: `temp-${Date.now()}`,
        text: textToSend,
        sender: 'admin',
        senderNumber: selectedRoom,
        platform: platform, 
        timestamp: { toDate: () => new Date() },
        status: 'sending' 
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      // SMART API ROUTING
      let apiUrl = '/api/send-message'; 
      if (platform === 'telegram') apiUrl = '/api/send-telegram';
      if (platform === 'telegram-api') apiUrl = '/api/send-telegram-client';

      await axios.post(apiUrl, { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { 
      console.error("Send Error", err);
      toast.error(`Message failed to send via ${platform.toUpperCase()}`); 
    }
  };

  // --- MEDIA SENDING ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;

    setFileLoading(true);
    toast.info("Media processing started...", { duration: 2000 }); 

    const cleanNumber = platform === 'whatsapp' ? selectedRoom.replace(/\D/g, '') : selectedRoom;
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

      // MEDIA API ROUTING (assuming send-telegram handles media, and send-telegram-client handles media later)
      let apiUrl = '/api/send-media';
      if (platform === 'telegram') apiUrl = '/api/send-telegram';
      if (platform === 'telegram-api') apiUrl = '/api/send-telegram-client'; 

      await axios.post(apiUrl, { userId: currentUserId, to: cleanNumber, mediaUrl: finalMediaUrl, mediaType });
      
      toast.success("Media sent successfully!"); 
    } catch (err) {
      console.error("Media Send Error", err);
      toast.error("Failed to send media file."); 
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
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] transition-all ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/5">
          <button onClick={onBack} className="text-zinc-500 hover:text-blue-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Inboxes
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${colors.primary}`}>
                {getPlatformIcon(16)}
            </div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter capitalize italic">
              {platform.replace('-', ' ')} <span className={colors.text}>Inbox</span>
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={16} />
            <input placeholder={`Search ${platform.replace('-', ' ')} chats...`} className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-[1.5rem] py-3.5 pl-12 pr-4 text-xs outline-none dark:text-white transition-all focus:ring-1 focus:ring-blue-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {rooms.map(num => (
            <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? `${colors.lightBg} border ${colors.border}` : 'bg-zinc-50 dark:bg-[#111] border border-transparent hover:border-white/5'}`}>
              <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 font-bold shadow-inner text-white ${colors.primary}`}>
                 {platform.includes('telegram') ? 'TG' : num.slice(0, 2)}
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className={`font-bold text-[13px] truncate ${selectedRoom === num ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{num}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedRoom === num ? colors.text : 'text-zinc-500'}`}>{platform.replace('-', ' ')}</p>
              </div>
            </button>
          ))}
          {rooms.length === 0 && (
             <div className="p-10 flex flex-col items-center justify-center text-center opacity-40">
               {getPlatformIcon(32, { className: `mb-4 ${colors.text}` })}
               <p className="font-bold text-[10px] uppercase tracking-[0.2em]">No messages yet</p>
             </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] relative ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-2xl z-40">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft size={24} /></button>
                <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-white font-black shadow-lg ${colors.primary} ${colors.shadow}`}>
                  {platform.includes('telegram') ? 'TG' : 'WA'}
                </div>
                <div>
                   <h3 className="font-bold text-[13px] dark:text-white truncate max-w-[200px] md:max-w-[250px]">{selectedRoom}</h3>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${colors.primary}`}></span>
                     <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                       Active Secure Link
                     </p>
                   </div>
                </div>
              </div>
              <MoreVertical size={20} className="text-zinc-400 cursor-pointer hover:text-white transition-colors" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className="max-w-[85%] md:max-w-[65%] group">
                    <div className={`p-3.5 md:p-4 rounded-[1.8rem] text-[13.5px] shadow-sm ${m.sender === 'admin' ? `${colors.primary} text-white rounded-tr-none` : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-white/5'}`}>
                      {m.mediaType === 'image' && (
                        <div className="mb-2 rounded-2xl overflow-hidden shadow-inner bg-black/10">
                          <img src={m.mediaUrl} alt="media" className="w-full max-h-80 object-cover cursor-pointer hover:scale-105 transition-transform duration-500" onClick={() => window.open(m.mediaUrl)} />
                        </div>
                      )}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-4 rounded-2xl mb-2 cursor-pointer hover:bg-black/20 transition-colors" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={24} className="opacity-80" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate">Open Secure Document</span>
                        </div>
                      )}
                      {m.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
                    </div>

                    {/* STATUS ICONS LOGIC */}
                    <div className={`flex items-center gap-1.5 mt-2 px-2 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase">{formatTime(m.timestamp)}</span>
                      {m.sender === 'admin' && (
                        <span className="transition-all">
                          {m.status === 'sending' ? (
                            <Clock size={10} className="text-zinc-400 animate-pulse" />
                          ) : platform.includes('telegram') ? (
                            <CheckCheck size={13} className={colors.text} title="Delivered via Telegram" />
                          ) : m.status === 'read' ? (
                            <CheckCheck size={13} className="text-blue-500" />
                          ) : m.status === 'delivered' ? (
                            <CheckCheck size={13} className="text-zinc-400" />
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

            {/* FLOATING INPUT FORM */}
            <div className="absolute bottom-2 md:bottom-6 left-0 right-0 px-3 md:px-6 z-50 pointer-events-none">
              <form onSubmit={sendMessage} className="pointer-events-auto w-full max-w-4xl mx-auto flex items-center gap-1 md:gap-3 bg-white dark:bg-[#111] p-1.5 md:p-2.5 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={fileLoading} className="p-2.5 md:p-3.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all shrink-0">
                  {fileLoading ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />}
                </button>
                <input 
                  type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} 
                  placeholder={`Secure transmission via ${platform.replace('-', ' ')}...`}
                  className="flex-1 min-w-0 bg-transparent py-3 px-2 outline-none dark:text-white text-sm font-medium" 
                />
                <button disabled={loading || fileLoading} className={`p-3 md:p-4 rounded-full text-white shadow-xl active:scale-90 transition-all flex items-center justify-center shrink-0 ${colors.primary} ${colors.hover} ${colors.shadow}`}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="ml-1 md:ml-0" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
             <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner animate-pulse ${colors.lightBg}`}>
                {getPlatformIcon(40, { className: `opacity-30 ${colors.text}` })}
             </div>
             <h3 className="text-2xl font-black dark:text-white italic tracking-tighter uppercase">
               Base<span className={colors.text}>Key</span> Neural Core
             </h3>
             <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-3 opacity-40">
               Awaiting {platform.replace('-', ' ')} Selection
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
