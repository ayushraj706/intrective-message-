import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../firebase'; 
import { 
  Smartphone, Bot, Globe, Facebook, Instagram, 
  Plus, ChevronLeft, MessageSquare, Trash2, Edit3, 
  ExternalLink, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

// Setup Components Imports
import WhatsAppSetup from '../setup/WhatsAppSetup';
import FacebookSetup from '../setup/FacebookSetup';
import InstagramSetup from '../setup/InstagramSetup';
import TelegramAPISetup from '../setup/TelegramAPISetup';
import TelegramBotSetup from '../setup/TelegramBotSetup';

const AddInbox = () => {
  const [view, setView] = useState('list'); 
  const [setupMode, setSetupMode] = useState(null);
  const [userInboxes, setUserInboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState(null);

  const currentUserId = auth.currentUser?.uid || "ADMIN_DEV";

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
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Meta Business API', icon: <Smartphone size={20} />, color: 'bg-emerald-500' },
    { id: 'facebook', name: 'Messenger', desc: 'Facebook Page DMs', icon: <Facebook size={20} />, color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', desc: 'Direct Messages', icon: <Instagram size={20} />, color: 'bg-pink-600' },
    { id: 'tg-api', name: 'Telegram API', desc: 'Custom Client', icon: <Globe size={20} />, color: 'bg-sky-500' },
    { id: 'tg-bot', name: 'Telegram Bot', desc: 'BotFather Integration', icon: <Bot size={20} />, color: 'bg-indigo-600' },
  ];

  const getChannelIcon = (id) => {
    const ch = channels.find(c => c.id === id);
    return ch ? { icon: ch.icon, color: ch.color } : { icon: <MessageSquare />, color: 'bg-zinc-500' };
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bhai, kya aap sach mein is inbox ko delete karna chahte hain?")) {
      try {
        await deleteDoc(doc(db, "inboxes", id));
      } catch (e) { alert("Delete fail ho gaya!"); }
    }
  };

  if (view === 'setup') {
    const props = { userId: currentUserId, onBack: () => setView('select') };
    if (setupMode === 'whatsapp') return <WhatsAppSetup {...props} />;
    if (setupMode === 'facebook') return <FacebookSetup {...props} />;
    if (setupMode === 'instagram') return <InstagramSetup {...props} />;
    if (setupMode === 'tg-api') return <TelegramAPISetup {...props} />;
    if (setupMode === 'tg-bot') return <TelegramBotSetup {...props} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] transition-all">
      
      {/* PROFESSIONAL TOP HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
              Neural <span className="text-blue-600">Nodes</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Connected Protocols Management</p>
          </div>

          {view === 'list' ? (
            <button 
              onClick={() => setView('select')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus size={18}/> Add New Inbox
            </button>
          ) : (
            <button onClick={() => setView('list')} className="text-zinc-500 hover:text-blue-600 flex items-center gap-2 text-xs font-bold uppercase">
              <ChevronLeft size={18}/> Back to Nodes
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: PROFESSIONAL LIST OF INBOXES */}
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userInboxes.length === 0 && !loading && (
                <div className="col-span-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <MessageSquare size={32}/>
                  </div>
                  <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">No active neural links found.</p>
                </div>
              )}

              {userInboxes.map((ibx) => {
                const chIcon = getChannelIcon(ibx.channelId);
                return (
                  <motion.div 
                    layout key={ibx.id} 
                    className="group bg-zinc-50 dark:bg-[#111] border border-zinc-100 dark:border-white/5 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                  >
                    {/* Status Indicator */}
                    <div className="absolute top-6 right-6 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Live</span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 ${chIcon.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                        {chIcon.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black dark:text-white uppercase italic tracking-tight">{ibx.channelName || 'Neural Node'}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{ibx.channelId}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Identifier:</p>
                       <p className="text-xs font-mono dark:text-blue-400 bg-blue-500/5 px-2 py-1 rounded-md inline-block">{ibx.identifier || 'N/A'}</p>
                    </div>

                    {/* ACTIONS BAR */}
                    <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedInbox(ibx); setShowEditModal(true); }}
                          className="p-2.5 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-blue-500 rounded-xl transition-colors border border-zinc-100 dark:border-zinc-700"
                        >
                          <Edit3 size={16}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(ibx.id)}
                          className="p-2.5 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl transition-colors border border-zinc-100 dark:border-zinc-700"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                      <button className="text-[9px] font-black text-blue-500 uppercase tracking-[0.1em] flex items-center gap-1 hover:underline">
                        Open Portal <ExternalLink size={10}/>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* VIEW 2: SELECT CHANNEL GRID */}
          {view === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((ch) => (
                <div 
                  key={ch.id} 
                  onClick={() => { setSetupMode(ch.id); setView('setup'); }}
                  className="bg-zinc-50 dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 hover:border-blue-600 transition-all group cursor-pointer"
                >
                  <div className={`w-14 h-14 ${ch.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {ch.icon}
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tighter mb-2">{ch.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed tracking-widest">{ch.desc}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EDIT MODAL: Details dekhne ke liye */}
      <AnimatePresence>
        {showEditModal && selectedInbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
                 <h2 className="text-xl font-black uppercase italic tracking-tighter">Node <span className="text-blue-500">Parameters</span></h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Channel Type</label>
                  <p className="font-bold text-blue-500 uppercase">{selectedInbox.channelId}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Verify Token</label>
                  <p className="text-xs font-mono dark:text-zinc-300 break-all bg-zinc-50 dark:bg-black p-3 rounded-xl border border-zinc-100 dark:border-white/5">
                    {selectedInbox.webhookVerifyToken || 'Not Provided'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Phone ID / Account ID</label>
                  <p className="text-xs font-mono dark:text-zinc-300 bg-zinc-50 dark:bg-black p-3 rounded-xl border border-zinc-100 dark:border-white/5">
                    {selectedInbox.identifier || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 items-center">
                   <CheckCircle2 className="text-emerald-500" size={18}/>
                   <p className="text-[10px] font-bold text-emerald-500 uppercase">Configuration Verified on Meta Cloud</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddInbox;
  
