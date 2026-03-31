import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, PlayCircle, Database, Plus, 
  CheckCircle, X, Zap, Globe, Cpu, User, CreditCard, 
  MapPin, Mail, Package, Truck, Calendar, Tag, 
  Hash, ShoppingBag, Clock, ShieldCheck, Headphones 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const FlowSidebar = () => {
  const [showVariables, setShowVariables] = useState(false);
  const [varName, setVarName] = useState("");
  const [varUrl, setVarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- 20 PRO VARIABLES (Businessman ki pasand) ---
  const suggestions = [
    { id: 'name', label: 'Name', icon: <User size={12}/> },
    { id: 'phone', label: 'Phone', icon: <Hash size={12}/> },
    { id: 'city', label: 'City', icon: <MapPin size={12}/> },
    { id: 'email', label: 'Email', icon: <Mail size={12}/> },
    { id: 'order_id', label: 'Order ID', icon: <Package size={12}/> },
    { id: 'tracking', label: 'Tracking', icon: <Truck size={12}/> },
    { id: 'balance', label: 'Balance', icon: <CreditCard size={12}/> },
    { id: 'date', label: 'Date', icon: <Calendar size={12}/> },
    { id: 'time', label: 'Time', icon: <Clock size={12}/> },
    { id: 'product', label: 'Product', icon: <ShoppingBag size={12}/> },
    { id: 'discount', label: 'Discount', icon: <Tag size={12}/> },
    { id: 'address', label: 'Address', icon: <Globe size={12}/> },
    { id: 'status', label: 'Status', icon: <Zap size={12}/> },
    { id: 'auth_code', label: 'OTP Code', icon: <ShieldCheck size={12}/> },
    { id: 'agent_name', label: 'Agent', icon: <Headphones size={12}/> }
  ];

  const handleSaveVariable = async () => {
    if (!varName || !varUrl || !auth.currentUser) return alert("Bhai, Details dalo!");
    setIsSaving(true);
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      await updateDoc(userRef, {
        customVariables: arrayUnion({ name: varName, url: varUrl })
      });
      alert("Neural Connection Fixed!");
      setVarName(""); setVarUrl("");
    } catch (e) { alert("Save Error!"); }
    setIsSaving(false);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col relative overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-white z-10">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-widest">
          BaseKey <span className="text-indigo-600">Studio</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-tight">Core Elements</h4>
          <div className="space-y-3">
            <div draggable onDragStart={(e) => onDragStart(e, 'startNode')} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:shadow-lg transition-all active:scale-95">
              <PlayCircle className="text-green-500" size={18} />
              <span className="text-xs font-bold text-slate-700">START TRIGGER</span>
            </div>
            <div draggable onDragStart={(e) => onDragStart(e, 'whatsappNode')} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:shadow-lg transition-all active:scale-95">
              <MessageSquare className="text-indigo-500" size={18} />
              <span className="text-xs font-bold text-slate-700">NEW MESSAGE</span>
            </div>
          </div>
        </div>

        <button onClick={() => setShowVariables(true)} className="w-full p-4 bg-slate-900 rounded-2xl flex items-center justify-between group hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3 text-white">
            <Database size={18} />
            <span className="text-xs font-black uppercase italic">Neural Vars</span>
          </div>
          <Cpu size={14} className="text-slate-500 group-hover:text-white" />
        </button>
      </div>

      {/* --- HD VARIABLE SETTINGS (Fixed Keyboard Issue) --- */}
      <AnimatePresence>
        {showVariables && (
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col h-[100dvh]" 
          >
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Variable <span className="text-indigo-600">Settings</span></h3>
              <button onClick={() => setShowVariables(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white pb-32">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Quick Suggestions (18+ Options)</label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button 
                      key={s.id} 
                      onClick={() => setVarName(s.id)} 
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${varName === s.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-300"}`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>

                <div className="pt-4 space-y-4">
                  <input value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="Identifier (e.g. balance)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                  <input value={varUrl} onChange={(e) => setVarUrl(e.target.value)} placeholder="API Source URL (https://...)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-mono outline-none focus:border-indigo-500 focus:bg-white text-indigo-600 transition-all" />
                  
                  <button onClick={handleSaveVariable} disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {isSaving ? <span className="animate-spin text-lg">⚙️</span> : <Zap size={14} />} 
                    {isSaving ? "SYNCING..." : "CONNECT NEURAL VAR"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default FlowSidebar;
    
