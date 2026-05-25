import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Check, CheckCheck } from 'lucide-react';

// --- SOUNDS (WhatsApp Style) ---
const SEND_SOUND = "https://www.soundjay.com/buttons/sounds/button-37.mp3"; 
const RECEIVE_SOUND = "https://www.soundjay.com/buttons/sounds/button-09.mp3";

const FlowSimulator = ({ nodes, edges, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const chatEndRef = useRef(null);

  // Sound Player Function
  const playSound = (url) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Sound play blocked by browser"));
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- AUTOMATION LOGIC ---
  useEffect(() => {
    const startNode = nodes.find(n => n.type === 'startNode');
    if (startNode) {
      const firstEdge = edges.find(e => e.source === startNode.id);
      if (firstEdge) {
        const firstNode = nodes.find(n => n.id === firstEdge.target);
        if (firstNode) {
            setTimeout(() => addBotMessage(firstNode), 1000);
        }
      }
    }
  }, []);

  const addBotMessage = (node) => {
    setCurrentNodeId(node.id);
    playSound(RECEIVE_SOUND);
    
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      data: node.data,
      nodeType: node.type
    };
    setMessages(prev => [...prev, newMessage]);

    // Agar AutoPlay ON hai toh agla button apne aap click hoga
    if (isAutoPlaying && node.data.buttons?.length > 0) {
      setTimeout(() => {
        handleButtonClick(node.data.buttons[0].id); // Pehla button auto-click
      }, 2500); // User ko padhne ka time dena
    }
  };

  const handleButtonClick = (btnId) => {
    const lastMsg = messages[messages.length - 1];
    const clickedBtn = lastMsg?.data.buttons?.find(b => b.id === btnId);
    
    if (!clickedBtn) return;

    // 1. User Message with "Single Tick"
    const userMsgId = Date.now();
    const newUserMsg = { 
      id: userMsgId, 
      type: 'user', 
      text: clickedBtn.label, 
      status: 'sent' 
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    playSound(SEND_SOUND);

    // 2. Tick Logic Animation (Sent -> Delivered -> Read)
    setTimeout(() => updateTick(userMsgId, 'delivered'), 500);
    setTimeout(() => updateTick(userMsgId, 'read'), 1000);

    // 3. Next Bot Message
    const nextEdge = edges.find(e => e.source === currentNodeId && e.sourceHandle === btnId);
    if (nextEdge) {
      const nextNode = nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        setTimeout(() => addBotMessage(nextNode), 2000);
      }
    }
  };

  const updateTick = (msgId, status) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status } : m));
  };

  // Tick Component
  const MessageTicks = ({ status }) => {
    if (status === 'sent') return <Check size={12} className="text-slate-400" />;
    if (status === 'delivered') return <CheckCheck size={12} className="text-slate-400" />;
    if (status === 'read') return <CheckCheck size={12} className="text-blue-500" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-[360px] h-[720px] bg-[#E5DDD5] rounded-[3.5rem] border-[10px] border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
      >
        {/* iPhone Style Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-900 rounded-b-3xl z-30 flex items-center justify-center">
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
        </div>
        
        {/* WhatsApp Header */}
        <div className="bg-[#075E54] p-5 pt-10 text-white flex items-center gap-3 shadow-lg z-20">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner">
            <Sparkles size={20} className="text-white animate-pulse"/>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black tracking-tight">BaseKey AI <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-1 uppercase">Live</span></h4>
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">Auto-Pilot Active</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={18}/></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ scale: 0.8, opacity: 0, x: msg.type === 'user' ? 50 : -50 }} 
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`${msg.type === 'user' ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'} max-w-[85%] rounded-2xl shadow-md p-3 relative group`}>
                    
                    {/* Bot Media Support */}
                    {msg.type === 'bot' && msg.data.header?.url && (
                        <motion.img 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          src={msg.data.header.url} 
                          className="w-full h-40 object-cover rounded-xl mb-2 border border-slate-100" 
                        />
                    )}

                    <p className="text-[12px] text-slate-800 font-medium leading-relaxed">{msg.text || msg.data.body}</p>
                    
                    {/* Bot Buttons (Show only if this is the latest bot message) */}
                    {msg.type === 'bot' && msg.data.buttons?.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {msg.data.buttons.map((btn, idx) => (
                                <motion.div
                                    key={btn.id}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-full py-2.5 text-center rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border
                                        ${idx === 0 && isAutoPlaying ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-50 text-indigo-600 border-indigo-50'}`}
                                >
                                    {btn.label}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Footer & Ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">10:45 AM</span>
                        {msg.type === 'user' && <MessageTicks status={msg.status} />}
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Typing Overlay for Professional Look */}
        {isAutoPlaying && (
            <div className="absolute bottom-24 left-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white shadow-xl flex items-center gap-2 animate-bounce">
                <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                </div>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Neural System Thinking...</span>
            </div>
        )}

        {/* Fake Input Footer */}
        <div className="p-4 bg-white border-t flex items-center gap-3">
          <div className="flex-1 bg-slate-100 h-11 rounded-full border border-slate-200 px-5 flex items-center">
             <span className="text-slate-400 text-xs font-medium italic">Type a message...</span>
          </div>
          <div className="w-11 h-11 bg-[#128C7E] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <Send size={20}/>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlowSimulator;
