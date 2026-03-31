import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smartphone, Sparkles, MessageCircle } from 'lucide-react';

const FlowSimulator = ({ nodes, edges, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);

  // 1. Simulator shuru karo (Start Node dhoondho)
  useEffect(() => {
    const startNode = nodes.find(n => n.type === 'startNode');
    if (startNode) {
      // Start node se juda pehla node dhoondho
      const firstEdge = edges.find(e => e.source === startNode.id);
      if (firstEdge) {
        const firstNode = nodes.find(n => n.id === firstEdge.target);
        if (firstNode) addMessage(firstNode);
      }
    }
  }, []);

  const addMessage = (node) => {
    setCurrentNodeId(node.id);
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      data: node.data,
      nodeType: node.type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleButtonClick = (btnId) => {
    // 1. User ka reply dikhao
    const clickedBtn = messages[messages.length - 1].data.buttons?.find(b => b.id === btnId);
    if (clickedBtn) {
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: clickedBtn.label }]);
    }

    // 2. Agla node dhoondho jo is button handle se juda hai
    const nextEdge = edges.find(e => e.source === currentNodeId && e.sourceHandle === btnId);
    if (nextEdge) {
      const nextNode = nodes.find(n => n.id === nextEdge.target);
      if (nextNode) {
        setTimeout(() => addMessage(nextNode), 800); // 800ms delay for real feel
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-[380px] h-[700px] bg-[#E5DDD5] rounded-[3rem] border-[12px] border-slate-950 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Mockup Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20" />
        
        {/* Header */}
        <div className="bg-[#075E54] p-6 pt-10 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><MessageCircle size={20}/></div>
          <div>
            <h4 className="text-sm font-bold">BaseKey AI Tester</h4>
            <p className="text-[10px] opacity-80 font-black uppercase tracking-widest">Neural Link Active</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'user' ? (
                  <div className="bg-[#DCF8C6] px-4 py-2 rounded-2xl rounded-tr-none shadow-sm text-xs font-bold text-slate-800">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-white max-w-[85%] rounded-2xl rounded-tl-none shadow-sm overflow-hidden border-l-4 border-indigo-500 p-2.5 space-y-2">
                    {msg.data.header?.url && <img src={msg.data.header.url} className="w-full h-32 object-cover rounded-xl" />}
                    {msg.data.header?.text && <p className="text-[10px] font-black uppercase text-slate-400 border-b pb-1">{msg.data.header.text}</p>}
                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{msg.data.body}</p>
                    {msg.data.footer && <p className="text-[9px] text-slate-400 italic">{msg.data.footer}</p>}
                    
                    {/* Simulator Buttons */}
                    <div className="pt-2 space-y-1.5 border-t border-slate-50">
                      {msg.data.buttons?.map(btn => (
                        <button 
                          key={btn.id} 
                          onClick={() => handleButtonClick(btn.id)}
                          className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/50 border-t flex items-center gap-2">
          <div className="flex-1 bg-white h-10 rounded-full border border-slate-200 px-4" />
          <div className="w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center text-white shadow-lg"><Send size={18}/></div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlowSimulator;
          
