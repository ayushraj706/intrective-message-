import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Plus, Zap, Globe, Database, Trash2, Loader2 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot, arrayRemove } from 'firebase/firestore';

const VariableManager = ({ onClose }) => {
  const [customVars, setCustomVars] = useState([]);
  const [varName, setVarName] = useState("");
  const [varUrl, setVarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Real-time Data Load
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setCustomVars(doc.data().customVariables || []);
      }
    });
    return () => unsub();
  }, []);

  const handleDelete = async (variable) => {
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      await updateDoc(userRef, { customVariables: arrayRemove(variable) });
    } catch (e) { alert("Delete failed!"); }
  };

  const handleSaveVariable = async () => {
    if (!varName || !varUrl) return alert("Details dalo bhai!");
    setIsSaving(true);
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      const newVar = { name: varName, url: varUrl, id: Date.now() };
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
      className="fixed inset-0 bg-white z-[200] flex flex-col h-[100dvh]" 
    >
      {/* Page Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase italic">Neural <span className="text-indigo-600">Variables</span></h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/20">
        {/* ADD NEW SECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <label className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
            <Plus size={14}/> Connect New API Source
          </label>
          <input 
            value={varName} onChange={(e) => setVarName(e.target.value)} 
            placeholder="Variable Name (e.g. user_balance)" 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 transition-all" 
          />
          <input 
            value={varUrl} onChange={(e) => setVarUrl(e.target.value)} 
            placeholder="API Endpoint (https://...)" 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-mono outline-none focus:border-indigo-400 text-indigo-600 transition-all" 
          />
          <button 
            onClick={handleSaveVariable} disabled={isSaving} 
            className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-indigo-100"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16} />}
            {isSaving ? "SYNCING..." : "CONNECT NEURAL VAR"}
          </button>
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Active Connections ({customVars.length})</label>
          {customVars.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-100 rounded-3xl">
              <Database className="mx-auto text-slate-100 mb-2" size={40}/>
              <p className="text-[10px] font-bold text-slate-300 uppercase italic">No variables found</p>
            </div>
          ) : (
            customVars.map((v, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase italic leading-none">{v.name}</span>
                  <button onClick={() => handleDelete(v)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
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
  );
};

export default VariableManager;
        
