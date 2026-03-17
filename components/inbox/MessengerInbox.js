import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, User, MessageSquare, Search, Facebook, Info, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const MessengerInbox = () => {
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Selected Customer ID
  const [inputText, setInputText] = useState('');
  const userEmail = auth.currentUser?.email;

  // 1. REAL-TIME FETCH: Messages load karna
  useEffect(() => {
    if (!userEmail) return;

    // Sirf Facebook platform ke messages uthao
    const q = query(
      collection(db, "users", userEmail, "messages"),
      where("platform", "==", "facebook"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      
      // Pehle customer ko auto-select kar lo agar koi chat selected nahi hai
      if (allMsgs.length > 0 && !activeChat) {
        const firstCustomer = allMsgs.find(m => m.type === 'incoming')?.senderId;
        if (firstCustomer) setActiveChat(firstCustomer);
      }
    });

    return () => unsubscribe();
  }, [userEmail, activeChat]);

  // 2. CHAT LIST LOGIC: Unique senders nikalna
  const chatList = [...new Set(messages
    .filter(m => m.type === 'incoming')
    .map(m => m.senderId)
  )];

  // 3. SEND MESSAGE: Firestore mein reply save karna
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    try {
      await addDoc(collection(db, "users", userEmail, "messages"), {
        senderId: activeChat,
        text: inputText,
        platform: 'facebook',
        type: 'outgoing', // Humne bheja
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (err) {
      toast.error("Message send nahi ho paya!");
    }
  };

  return (
    <div className="flex h-full bg-[#080808] text-white rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
      
      {/* LEFT SIDEBAR: Conversations */}
      <div className="w-80 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-blue-600/5 to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600/20 rounded-xl text-blue-500">
                <Facebook size={20} />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Messenger <span className="text-zinc-500">Node</span></h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-zinc-600" size={14} />
            <input type="text" placeholder="Search customer..." className="w-full bg-black/50 border border-white/5 rounded-2xl p-3 pl-10 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-blue-500/50 transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {chatList.length > 0 ? chatList.map((senderId) => (
            <div 
              key={senderId}
              onClick={() => setActiveChat(senderId)}
              className={`p-4 rounded-3xl flex items-center gap-4 cursor-pointer transition-all border ${
                activeChat === senderId 
                ? 'bg-blue-600/10 border-blue-500/20 shadow-lg' 
                : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 text-blue-500">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tighter italic">ID: {senderId.slice(-6)}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Facebook User</p>
              </div>
              <ChevronRight size={14} className={activeChat === senderId ? 'text-blue-500' : 'text-zinc-700'} />
            </div>
          )) : (
            <div className="text-center py-20">
                <MessageSquare className="mx-auto text-zinc-800 mb-4" size={40} />
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">No Messages Yet</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Chat Window */}
      <div className="flex-1 flex flex-col bg-[#080808] relative">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-xl bg-[#080808]/80 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-black italic border border-blue-500/20">FB</div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Neural Thread <span className="text-blue-500">#{activeChat.slice(-4)}</span></h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic">Live Connection</p>
                  </div>
                </div>
              </div>
              <button className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
                <Info size={18} />
              </button>
            </div>

            {/* Messages Pane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.filter(m => m.senderId === activeChat).map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[70%] p-5 rounded-[2.5rem] text-xs font-medium leading-relaxed shadow-2xl ${
                    msg.type === 'outgoing' 
                    ? 'bg-blue-600 text-white rounded-tr-none border border-white/10' 
                    : 'bg-zinc-900 border border-white/5 rounded-tl-none text-zinc-200'
                  }`}>
                    {msg.text}
                    <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest ${msg.type === 'outgoing' ? 'text-blue-200' : 'text-zinc-600'}`}>
                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-8 bg-[#0a0a0a] border-t border-white/5">
              <div className="relative flex items-center gap-4">
                <input 
                  type="text" value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Neural reply..." 
                  className="flex-1 bg-black border border-white/5 rounded-3xl p-6 text-xs outline-none focus:border-blue-500/50 transition-all font-bold tracking-wide placeholder:text-zinc-700" 
                />
                <button type="submit" className="bg-blue-600 p-6 rounded-3xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <Facebook size={100} className="mb-6" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Select a Node to Start</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;
    
