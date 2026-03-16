import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MessageSquare, ChevronLeft, CheckCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const WhatsAppInbox = ({ onBack }) => {
  const platform = 'whatsapp';
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredMsgs = allMsgs.filter(m => !m.platform || m.platform === 'whatsapp');
      setMessages(filteredMsgs);
      setRooms([...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse());
    });
    return () => unsubscribe();
  }, [currentUserId]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    const textToSend = inputText;
    const cleanNumber = selectedRoom.replace(/\D/g, ''); 
    setInputText('');
    try {
      await axios.post('/api/send-message', { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { toast.error("WhatsApp message failed!"); }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden transition-all duration-500">
      <div className={`w-full md:w-96 border-r border-zinc-100 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <button onClick={onBack} className="text-zinc-500 mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft size={14} /> Back</button>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-green-600"><MessageSquare size={16} /></div>
            <h2 className="text-2xl font-black dark:text-white tracking-tighter italic">WhatsApp <span className="text-green-600">Inbox</span></h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map(num => (
            <button key={num} onClick={() => setSelectedRoom(num)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${selectedRoom === num ? 'bg-green-600/10 border border-green-600/20' : 'bg-zinc-50 dark:bg-[#111]'}`}>
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">{num.slice(0, 2)}</div>
              <div className="text-left overflow-hidden"><p className="font-bold text-[13px] dark:text-white truncate">{num}</p></div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#050505]">
        {selectedRoom ? (
          <div className="flex flex-col h-full relative">
            <div className="px-6 py-4 border-b border-white/5 bg-black/60 backdrop-blur-2xl flex items-center gap-4">
              <button onClick={() => setSelectedRoom(null)} className="md:hidden p-2 text-zinc-500"><ChevronLeft size={24} /></button>
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold">WA</div>
              <h3 className="font-bold text-[13px] dark:text-white">{selectedRoom}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
              {messages.filter(m => m.senderNumber === selectedRoom).map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[1.5rem] max-w-[70%] text-[13.5px] ${m.sender === 'admin' ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-6 left-0 right-0 px-6">
               <form onSubmit={sendMessage} className="bg-white dark:bg-[#111] p-2 rounded-full flex gap-2 border border-white/10 shadow-2xl">
                  <input value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 bg-transparent px-4 outline-none dark:text-white" placeholder="WhatsApp secure transmission..." />
                  <button className="p-3 rounded-full bg-green-600 text-white shadow-green-600/20 shadow-xl"><Send size={18}/></button>
               </form>
            </div>
          </div>
        ) : <div className="m-auto opacity-30 text-green-500 italic font-bold">Select WhatsApp Chat</div>}
      </div>
    </div>
  );
};

export default WhatsAppInbox;
