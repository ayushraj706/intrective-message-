import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, User, Search, MoreVertical, MessageSquare, Loader2, Check, ChevronLeft, Paperclip, FileText } from 'lucide-react';
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

  const CLOUD_NAME = "dprbizfao"; 
  const UPLOAD_PRESET = "ayush_social";

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoom) return;

    setFileLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      // 1. क्लाउडिनरी पर अपलोड
      const cl_res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      
      const mediaUrl = cl_res.data.secure_url;
      const mediaType = file.type.startsWith('image') ? 'image' : 'document';

      // 2. अपने बैकएंड को बोलना व्हाट्सएप पर भेजने के लिए
      await axios.post('/api/send-media', { 
        userId, 
        to: selectedRoom, 
        mediaUrl, 
        mediaType 
      });

    } catch (err) { 
      console.error(err);
      alert("Nahi hua bhai! Check api/send-media.js or Cloudinary Config."); 
    }
    setFileLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden relative">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-zinc-100 dark:border-zinc-800/50 flex flex-col bg-white dark:bg-[#0a0a0a] transition-all ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-black dark:text-white tracking-tighter mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-3 text-zinc-500" size={18} />
            <input placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none dark:text-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pt-4 px-2">
          {rooms.map(num => (
            <div key={num} onClick={() => setSelectedRoom(num)}
              className={`p-4 mb-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${selectedRoom === num ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-400'}`}>
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-gray-800 flex items-center justify-center font-bold text-xs">{num.slice(-2)}</div>
              <p className="font-bold text-sm truncate">{num}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505] transition-all ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-white/80 dark:bg-black/60 backdrop-blur-xl z-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 -ml-2 text-zinc-500"><ChevronLeft size={24} /></button>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-600/20">B</div>
                  <span className="font-bold text-base dark:text-white truncate">{selectedRoom}</span>
                </div>
                <MoreVertical size={20} className="text-zinc-500" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className="max-w-[85%] md:max-w-[65%] group">
                    <div className={`p-3 md:p-4 rounded-2xl text-[14px] shadow-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-gray-800'}`}>
                      
                      {/* --- Image Display --- */}
                      {m.mediaType === 'image' && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          <img src={m.mediaUrl} alt="sent" className="w-full max-h-72 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(m.mediaUrl)} />
                        </div>
                      )}
                      
                      {/* --- Document Display --- */}
                      {m.mediaType === 'document' && (
                        <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl mb-2 cursor-pointer" onClick={() => window.open(m.mediaUrl)}>
                          <FileText size={20} className="text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-widest">Document</span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{formatTime(m.timestamp)}</span>
                       {m.sender === 'admin' && <Check size={10} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800/50 z-50">
              <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-5xl mx-auto">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 text-zinc-500 hover:text-blue-500">
                  {fileLoading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                </button>
                
                <input 
                  type="text"
                  autoComplete="off"
                  data-form-type="other"
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-5 py-3.5 outline-none dark:text-white border border-transparent focus:border-blue-500/50 text-sm" 
                />
                
                <button disabled={loading || fileLoading} className="bg-blue-600 hover:bg-blue-500 p-3.5 rounded-2xl text-white transition-all shadow-lg active:scale-95">
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-10 text-center">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-110">
                <MessageSquare size={32} className="opacity-20 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">BaseKey Messages</h3>
            <p className="text-xs max-w-xs leading-relaxed font-medium">Select a customer to begin real-time communication.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
