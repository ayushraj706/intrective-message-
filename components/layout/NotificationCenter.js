import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';

const NotificationCenter = () => {
  const [notifs, setNotifs] = useState([]);
  const [show, setShow] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "notifications"), orderBy("timestamp", "desc"), limit(5));
    return onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [userId]);

  // Error Messages in Hindi/English
  const getBhashaError = (msg) => {
    if (msg.includes("quota")) return "Google ki limit khatam ho gayi hai. Kal try karein ya API badlein.";
    if (msg.includes("404")) return "Model nahi mila. AI settings check karein.";
    return msg; // Default English
  };

  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} className="p-3 bg-zinc-900 rounded-2xl border border-white/5 relative hover:scale-105 transition-all">
        <Bell size={18} className={notifs.length > 0 ? "text-blue-500 animate-swing" : "text-zinc-500"} />
        {notifs.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>}
      </button>

      {show && (
        <div className="absolute right-0 mt-4 w-72 bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl p-4 z-[999] backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Alerts</h4>
            <button onClick={() => setShow(false)}><X size={14} className="text-zinc-700"/></button>
          </div>
          <div className="space-y-3">
            {notifs.length === 0 ? (
              <p className="text-[10px] text-zinc-600 text-center py-6 italic font-mono">System Status: All Clear</p>
            ) : (
              notifs.map(n => (
                <div key={n.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group">
                  <div className="flex gap-3">
                    <AlertTriangle size={14} className="text-red-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{n.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{getBhashaError(n.message)}</p>
                      <p className="text-[8px] text-blue-500/50 mt-2 font-black uppercase">{n.platform}</p>
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
        
