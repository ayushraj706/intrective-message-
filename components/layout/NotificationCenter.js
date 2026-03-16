import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

const NotificationCenter = () => {
  const [notifs, setNotifs] = useState([]);
  const [show, setShow] = useState(false);
  const userId = auth.currentUser?.uid;

  // Real-time notifications load karo
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "notifications"), orderBy("timestamp", "desc"), limit(6));
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userId]);

  const unreadCount = notifs.filter(n => n.status === 'unread').length;

  // Galti ko Hindi mein dikhane ke liye helper
  const translateError = (msg) => {
    if (!msg) return "Unknown Error";
    const lowMsg = msg.toLowerCase();
    if (lowMsg.includes("quota")) return "Google AI ki limit khatam ho gayi hai. Kal try karein.";
    if (lowMsg.includes("404")) return "Model nahi mila! AI settings check karein.";
    if (lowMsg.includes("api key")) return "Aapki API Key galat hai, use sahi karein.";
    return msg; 
  };

  const markAsRead = async (id) => {
    try {
      const ref = doc(db, "users", userId, "notifications", id);
      await updateDoc(ref, { status: 'read' });
    } catch (e) { console.log(e); }
  };

  return (
    <div className="relative">
      {/* BELL ICON BUTTON */}
      <button 
        onClick={() => setShow(!show)} 
        className="p-2.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all relative group"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-blue-500 animate-pulse" : "text-zinc-500"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#080808] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN PANEL - FIXED ON RIGHT SIDE */}
      {show && (
        <div className="fixed top-5 right-5 w-85 max-w-[calc(100vw-40px)] bg-white dark:bg-[#0f0f0f]/95 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-6 z-[999] backdrop-blur-3xl animate-in slide-in-from-right-10 duration-300">
          <div className="flex justify-between items-center mb-6 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Neural Alerts
            </h4>
            <button onClick={() => setShow(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={18}/>
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {notifs.length === 0 ? (
              <div className="py-14 text-center opacity-20">
                <Info size={30} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Neural Link: Stable</p>
              </div>
            ) : (
              notifs.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${n.status === 'unread' ? 'bg-blue-600/5 border-blue-500/20' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5'}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                       {n.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-white leading-tight">{n.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{translateError(n.message)}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] font-black uppercase tracking-tighter bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{n.platform}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- YE HAI SABSE JARURI LINE ---
export default NotificationCenter; 
                         
