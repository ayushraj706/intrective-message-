import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Plus, Zap, Globe, Database, Trash2, Loader2, User, Phone, Settings 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot, arrayRemove } from 'firebase/firestore';

const VariableManager = ({ onClose }) => {
  const [customVars, setCustomVars] = useState([]);
  const [varName, setVarName] = useState("");
  const [varUrl, setVarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Default System Variables (Businessman ko ye type nahi karne padenge)
  const systemVars = [
    { name: "name", desc: "Customer Name" },
    { name: "phone", desc: "WhatsApp Number" }
  ];

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setCustomVars(doc.data().customVariables || []);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveVariable = async () => {
    if (!varName || !varUrl) return alert("Details bharo bhai!");
    setIsSaving(true);
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      const newVar = { name: varName.toLowerCase().replace(/\s+/g, '_'), url: varUrl, id: Date.now() };
      await updateDoc(userRef, {
        customVariables: [...customVars, newVar]
      });
      setVarName(""); setVarUrl("");
    } catch (e) { alert("Save failed!"); }
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      className="fixed inset-0 bg-white z-[250] flex flex-col h-[100dvh] font-sans" 
    >
      {/* 1. HEADER (Kala Text) */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 shadow-lg z-50">
        <div>
          <h3 className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2">
            <Settings size={16} className="text-indigo-400"/> Neural <span className="text-indigo-400">Variables</span>
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Architecture Configuration</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/40 scrollbar-hide">
        
        {/* 2. SYSTEM VARIABLES (No Typing Needed) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Zap size={12} className="text-yellow-500"/> Core System Variables
          </label>
          <div className="grid grid-cols-2 gap-3">
            {systemVars.map(v => (
              <div key={v.name} className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  {v.name === 'name' ? <User size={14}/> : <Phone size={14}/>}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase">{`{{${v.name}}}`}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ADD NEW API SOURCE (Input Visibility Fix) */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-slate-100 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <label className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2">
            <Plus size={14}/> Connect External Data (API)
          </label>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase px-2">Variable Key Name</label>
              <input 
                value={varName} onChange={(e) => setVarName(e.target.value)} 
                placeholder="e.g. user_balance" 
                // VISIBILITY FIX: font-black and text-slate-900
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase px-2">Data Endpoint URL</label>
              <input 
                value={varUrl} onChange={(e) => setVarUrl(e.target.value)} 
                placeholder="https://api.yourstore.com/balance" 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" 
              />
            </div>
          </div>

          <button 
            onClick={handleSaveVariable} disabled={isSaving} 
            className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase rounded-[2rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16} className="text-yellow-400"/>}
            {isSaving ? "INTEGRATING..." : "DEPLOY NEURAL VAR"}
          </button>
        </div>

        {/* 4. ACTIVE CONNECTIONS (Kala Text Fix) */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
             <Database size={12}/> Connected Neural Sources ({customVars.length})
          </label>
          
          {customVars.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
              <Database className="mx-auto text-slate-200 mb-2" size={40}/>
              <p className="text-[10px] font-black text-slate-300 uppercase italic">No Custom Data Sources</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customVars.map((v) => (
                <div key={v.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-md flex flex-col gap-3 group relative overflow-hidden">
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                       {/* VISIBILITY: variable name is solid black */}
                       <span className="text-xs font-black text-slate-900 uppercase italic leading-none">{`{{${v.name}}}`}</span>
                    </div>
                    <button onClick={() => {
                       const userRef = doc(db, "configs", auth.currentUser.uid);
                       updateDoc(userRef, { customVariables: arrayRemove(v) });
                    }} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-full">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Globe size={12} className="text-indigo-400"/>
                    <span className="text-[9px] font-bold text-slate-500 truncate flex-1">{v.url}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM CLOSE BAR */}
      <div className="p-6 bg-white border-t mt-auto shadow-2xl z-50">
        <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-900 text-[10px] font-black uppercase rounded-[2rem] tracking-widest active:scale-95 transition-all">
          Back to Architecture
        </button>
      </div>
    </motion.div>
  );
};

export default VariableManager;
                  
