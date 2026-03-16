import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const NotificationCenter = () => {
  const [notifs, setNotifs] = useState([]);
  const [show, setShow] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "notifications"), orderBy("timestamp", "desc"), limit(6));
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userId]);

  const unreadCount = notifs.filter(n => n.status === 'unread').length;

  // Bhai, ye function errors ko Hindi mein convert karega
  const translateError = (msg) => {
    if (msg.includes("quota")) return "Google AI ki limit khatam ho gayi hai. Kal try karein.";
    if (msg.includes("404")) return "Model nahi mila! AI settings check karein.";
    if (msg.includes("API key")) return "Aapki API Key galat hai, use sahi karein.";
    return msg; 
  };

  const markAsRead = async (id) => {
    const ref = doc(db, "users", userId, "notifications", id);
    await updateDoc(ref, { status: 'read' });
  };

  return (
    <div className="relative">
      {/* BELL ICON BUTTON */}
      <button 
        onClick={() => setShow(!show)} 
        className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all relative group"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-blue-500 animate-pulse" : "text-zinc-500"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#080808] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {show && (
        <div className="absolute right-0 mt-6 w-80 bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] shadow-2xl p-5 z-[999] backdrop-blur-2xl">
          <div className="flex justify-between items-center mb-6 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Neural Alerts</h4>
            <button onClick={() => setShow(false)} className="text-zinc-700 hover:text-white"><X size={16}/></button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifs.length === 0 ? (
              <div className="py-10 text-center opacity-20">
                <Info size={30} className="mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Alerts Yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${n.status === 'unread' ? 'bg-blue-600/5 border-blue-500/20' : 'bg-white/[0.02] border-white/5'}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                       {n.type === 'error' ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{n.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{translateError(n.message)}</p>
                      <div className="flex items-center gap-2 mt-3">
                         <span className="text-[8px] font-black uppercase tracking-tighter bg-white/5 px-2 py-1 rounded text-zinc-600">{n.platform}</span>
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

export default NotificationCenter;
        
