import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Send, User, MessageSquare, Search, Facebook, Info, ChevronRight, Image as ImageIcon, Mic } from 'lucide-react';
import { toast } from 'sonner';

const MessengerInbox = () => {
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const userEmail = auth.currentUser?.email || localStorage.getItem('admin_email');

  // 1. FETCH ALL MESSAGES: Real-time sync for entire node
  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, "users", userEmail.toLowerCase(), "messages"),
      orderBy("timestamp", "desc"), // Latest pehle
      limit(100) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
    });

    return () => unsubscribe();
  }, [userEmail]);

  // 2. NEURAL CHAT LIST: Unique customers sorted by latest message
  const chatList = useMemo(() => {
    const groups = {};
    messages.forEach(m => {
      if (!groups[m.senderId]) {
        groups[m.senderId] = {
          senderId: m.senderId,
          lastMsg: m.text || (m.mediaType === 'image' ? 'Sent a photo' : 'Voice message'),
          time: m.timestamp,
          platform: m.platform
        };
      }
    });
    return Object.values(groups);
  }, [messages]);

  // 3. SEND MESSAGE
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    try {
      await addDoc(collection(db, "users", userEmail.toLowerCase(), "messages"), {
        senderId: activeChat,
        text: inputText,
        platform: 'facebook',
        type: 'outgoing',
        status: 'sent',
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (err) {
      toast.error("Send Failed");
    }
  };

  return (
    <div className="flex h-full bg-[#080808] text-white rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
      
      {/* SIDEBAR: Conversations */}
      <div className="w-80 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Facebook className="text-blue-500" size={24} fill="currentColor" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Neural <span className="text-zinc-600">Inbox</span></h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-4 text-zinc-700" size={14} />
            <input type="text" placeholder="Search Node..." className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-[10px] uppercase font-black tracking-widest outline-none focus:border-blue-500/30 transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {chatList.map((chat) => (
            <div 
              key={chat.senderId}
              onClick={() => setActiveChat(chat.senderId)}
              className={`p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all border ${
                activeChat === chat.senderId 
                ? 'bg-blue-600/10 border-blue-500/20 shadow-lg' 
                : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-blue-500 border border-white/5">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tighter italic">ID: {chat.senderId.slice(-6)}</p>
                <p className="text-[9px] text-zinc-500 font-bold truncate uppercase tracking-widest mt-1">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-[#080808]">
        {activeChat ? (
          <>
            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6 flex flex-col-reverse scrollbar-hide">
              {messages.filter(m => m.senderId === activeChat).map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[65%] p-6 rounded-[2.5rem] text-sm shadow-2xl ${
                    msg.type === 'outgoing' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-zinc-900 border border-white/5 rounded-tl-none'
                  }`}>
                    {/* Render Text */}
                    {msg.text && <p className="font-medium leading-relaxed">{msg.text}</p>}
                    
                    {/* Render Image */}
                    {msg.mediaType === 'image' && (
                      <img src={msg.mediaUrl} alt="attachment" className="rounded-2xl max-h-60 w-full object-cover mt-2" />
                    )}

                    {/* Render Audio */}
                    {msg.mediaType === 'audio' && (
                      <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl mt-2">
                        <Mic size={16} className="text-blue-300" />
                        <audio src={msg.mediaUrl} controls className="h-8 w-40" />
                      </div>
                    )}

                    <p className={`text-[8px] mt-3 font-black uppercase tracking-widest opacity-50`}>
                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-10 bg-[#0a0a0a] border-t border-white/5">
              <div className="relative flex items-center gap-4">
                <input 
                  type="text" value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type neural reply..." 
                  className="flex-1 bg-black border border-white/5 rounded-[2rem] p-6 text-xs outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-zinc-800" 
                />
                <button type="submit" className="bg-blue-600 p-6 rounded-[2rem] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <Facebook size={120} />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mt-6">Select a Node</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;
                      
