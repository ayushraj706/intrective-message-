import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../firebase'; // Path check kar lena
import { 
  Smartphone, Bot, Globe, Facebook, Instagram, 
  Plus, ChevronLeft, LayoutGrid, MessageSquare, 
  Zap, PlusCircle, AlertCircle 
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Setup Components Imports
import WhatsAppSetup from '../setup/WhatsAppSetup';
import FacebookSetup from '../setup/FacebookSetup';
import InstagramSetup from '../setup/InstagramSetup';
import TelegramAPISetup from '../setup/TelegramAPISetup';
import TelegramBotSetup from '../setup/TelegramBotSetup';

const AddInbox = () => {
  const [view, setView] = useState('list'); // 'list', 'select', 'setup'
  const [setupMode, setSetupMode] = useState(null);
  const [userInboxes, setUserInboxes] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth.currentUser?.uid || "ADMIN_DEV";

  // 1. Database se connected inboxes fetch karna
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "inboxes"), where("userId", "==", currentUserId));
    const unsub = onSnapshot(q, (snapshot) => {
      const inboxes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserInboxes(inboxes);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUserId]);

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Official Business API', icon: <Smartphone size={24} />, color: 'text-emerald-500' },
    { id: 'facebook', name: 'Messenger', desc: 'Facebook Page DMs', icon: <Facebook size={24} />, color: 'text-blue-500' },
    { id: 'instagram', name: 'Instagram', desc: 'Business Auto-replies', icon: <Instagram size={24} />, color: 'text-pink-500' },
    { id: 'tg-api', name: 'Telegram API', desc: 'Custom Client API', icon: <Globe size={24} />, color: 'text-sky-500' },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'BotFather Integration', icon: <Bot size={24} />, color: 'text-indigo-500' },
  ];

  // Logic to return setup pages
  if (view === 'setup') {
    const props = { userId: currentUserId, onBack: () => setView('select') };
    if (setupMode === 'whatsapp') return <WhatsAppSetup {...props} />;
    if (setupMode === 'facebook') return <FacebookSetup {...props} />;
    if (setupMode === 'instagram') return <InstagramSetup {...props} />;
    if (setupMode === 'tg-api') return <TelegramAPISetup {...props} />;
    if (setupMode === 'tg-bot') return <TelegramBotSetup {...props} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#080808] p-6 md:p-12 transition-all">
      
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-white">
            Neural <span className="text-blue-600">Inboxes</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm mt-1 uppercase tracking-widest italic">
            {view === 'list' ? 'Managing connected nodes' : 'Select connection protocol'}
          </p>
        </div>
        
        {view === 'select' && (
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-blue-600 transition-all"
          >
            <ChevronLeft size={16}/> Back to List
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: ACTIVE INBOX LIST */}
        {view === 'list' && (
          <motion.div 
            key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* PLUS CARD: Trigger for adding new */}
              <div 
                onClick={() => setView('select')}
                className="group relative h-64 bg-white dark:bg-[#111] rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <PlusCircle size={48} className="text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-blue-600">Link New Node</span>
              </div>

              {/* Show existing inboxes if any */}
              {userInboxes.map((ibx) => (
                <div key={ibx.id} className="h-64 bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                         <MessageSquare size={24}/>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-full">Active Link</div>
                   </div>
                   <h3 className="text-xl font-black italic tracking-tighter dark:text-white uppercase mb-1">{ibx.channelName || 'Neural Node'}</h3>
                   <p className="text-xs text-zinc-500 font-bold mb-4">{ibx.identifier || 'Running automation...'}</p>
                   <div className="pt-4 border-t border-zinc-50 dark:border-white/5 flex gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase italic">Data Stream Active</span>
                   </div>
                </div>
              ))}
            </div>

            {/* Zero State Info */}
            {!loading && userInboxes.length === 0 && (
              <div className="mt-12 p-8 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 flex items-center gap-4 max-w-2xl">
                 <AlertCircle className="text-blue-500" size={24}/>
                 <p className="text-xs font-bold text-blue-600/80 uppercase tracking-tight">No active nodes detected. Click the pulse icon above to establish your first neural connection.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: CHANNEL SELECTION GRID */}
        {view === 'select' && (
          <motion.div 
            key="select" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {channels.map((ch) => (
              <div 
                key={ch.id} 
                onClick={() => { setSetupMode(ch.id); setView('setup'); }}
                className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 cursor-pointer transition-all group"
              >
                <div className={`w-14 h-14 bg-zinc-50 dark:bg-black rounded-2xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all ${ch.color}`}>
                    {ch.icon}
                </div>
                <h3 className="text-xl font-black mb-2 text-zinc-900 dark:text-white uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors">{ch.name}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-bold uppercase tracking-wide">{ch.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddInbox;
    
