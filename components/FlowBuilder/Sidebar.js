import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, PlayCircle, Database, Plus, 
  CheckCircle, X, Zap, Globe, Cpu, User, CreditCard, 
  MapPin, Trash2, Edit3, Save, Loader2 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot, arrayRemove } from 'firebase/firestore';

const FlowSidebar = () => {
  const [showVariables, setShowVariables] = useState(false);
  const [customVars, setCustomVars] = useState([]); // Database se aane wali list
  const [varName, setVarName] = useState("");
  const [varUrl, setVarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // Kaunsa variable edit ho raha hai

  // 1. REAL-TIME DATA LOAD (Black screen fix)
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setCustomVars(doc.data().customVariables || []); // Safe check for undefined
      }
    });
    return () => unsub();
  }, []);

  // 2. DELETE LOGIC
  const handleDelete = async (variable) => {
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      await updateDoc(userRef, {
        customVariables: arrayRemove(variable)
      });
    } catch (e) { alert("Delete fail!"); }
  };

  // 3. ADD/SAVE LOGIC
  const handleSaveVariable = async () => {
    if (!varName || !varUrl) return alert("Bhai, Details dalo!");
    setIsSaving(true);
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      const newVar = { name: varName, url: varUrl, id: Date.now() };
      await updateDoc(userRef, {
        customVariables: [...customVars, newVar]
      });
      setVarName(""); setVarUrl("");
    } catch (e) { alert("Save fail!"); }
    setIsSaving(false);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col relative overflow-hidden">
      {/* Sidebar Header */}
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

      {/* --- VARIABLE MANAGEMENT PANEL --- */}
      <AnimatePresence>
        {showVariables && (
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            className="fixed inset-0 bg-white z-[100] flex flex-col h-[100dvh]" 
          >
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Neural <span className="text-indigo-600">Integration</span></h3>
              <button onClick={() => setShowVariables(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/30">
              
              {/* SECTION 1: ADD NEW */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <label className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2"><Plus size={12}/> Connect New Source</label>
                <input value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="Identifier (e.g. balance)" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 transition-all" />
                <input value={varUrl} onChange={(e) => setVarUrl(e.target.value)} placeholder="External API URL (https://...)" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-mono outline-none focus:border-indigo-400 text-indigo-600 transition-all" />
                <button onClick={handleSaveVariable} disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14} />} {isSaving ? "Connecting..." : "Sync Variable"}
                </button>
              </div>

              {/* SECTION 2: CONNECTED LIST (The Edit/Delete Logic) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Connected Neural Nodes ({customVars.length})</label>
                
                {customVars.length === 0 ? (
                  <div className="text-center p-10 border-2 border-dashed border-slate-100 rounded-3xl">
                    <Database className="mx-auto text-slate-200 mb-2" size={32}/>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No variables connected</p>
                  </div>
                ) : (
                  customVars.map((v, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                          <span className="text-xs font-black text-slate-800 uppercase italic">{{v.name}}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(v)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                        <Globe size={12} className="text-slate-400"/>
                        <span className="text-[9px] font-mono text-slate-500 truncate flex-1">{v.url}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default FlowSidebar;
                                                                            
