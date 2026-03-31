import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, PlayCircle, Database, Plus, 
  CheckCircle, X, Zap, Globe, Cpu, User, CreditCard, MapPin 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for clean tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FlowSidebar = () => {
  const [showVariables, setShowVariables] = useState(false);
  const [varName, setVarName] = useState("");
  const [varUrl, setVarUrl] = useState("");

  // Pre-defined Variable Options
  const suggestions = [
    { id: 'name', label: 'Name', icon: <User size={12}/> },
    { id: 'balance', label: 'Balance', icon: <CreditCard size={12}/> },
    { id: 'city', label: 'City', icon: <MapPin size={12}/> },
    { id: 'order', label: 'Order ID', icon: <Zap size={12}/> }
  ];

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 bg-white z-10">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-widest">
          BaseKey <span className="text-indigo-600">Studio</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {/* Core Elements */}
        <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-tight">Core Elements</h4>
          <div className="space-y-3">
            <div 
              draggable 
              onDragStart={(e) => onDragStart(e, 'startNode')}
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:shadow-lg transition-all"
            >
              <PlayCircle className="text-green-500" size={18} />
              <span className="text-xs font-bold text-slate-700">START TRIGGER</span>
            </div>
            <div 
              draggable 
              onDragStart={(e) => onDragStart(e, 'messageNode')}
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:shadow-lg transition-all"
            >
              <MessageSquare className="text-indigo-500" size={18} />
              <span className="text-xs font-bold text-slate-700">NEW MESSAGE</span>
            </div>
          </div>
        </div>

        {/* Neural Variables Button */}
        <button 
          onClick={() => setShowVariables(true)}
          className="w-full p-4 bg-slate-900 rounded-2xl flex items-center justify-between group hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
        >
          <div className="flex items-center gap-3 text-white">
            <Database size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black uppercase italic">Neural Vars</span>
          </div>
          <Cpu size={14} className="text-slate-500 group-hover:text-white" />
        </button>
      </div>

      {/* --- HD VARIABLE SETTINGS PANEL --- */}
      <AnimatePresence>
        {showVariables && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white z-[100] flex flex-col shadow-2xl h-full"
          >
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Variable <span className="text-indigo-600">Settings</span></h3>
              <button onClick={() => setShowVariables(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white pb-20">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Quick Suggestions</label>
                   <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[8px] font-bold rounded-full">Pro Feature</span>
                </div>
                
                {/* Suggestions Chips */}
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => setVarName(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                        varName === s.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-300"
                      )}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                   <div className="space-y-1.5">
                     <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Variable Identifier</span>
                     <input 
                       value={varName}
                       onChange={(e) => setVarName(e.target.value)}
                       placeholder="e.g. user_balance"
                       className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                     />
                   </div>

                   <div className="space-y-1.5">
                     <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Data Source URL</span>
                     <div className="relative">
                       <input 
                         value={varUrl}
                         onChange={(e) => setVarUrl(e.target.value)}
                         placeholder="https://api.yourwebsite.com/v1"
                         className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-mono outline-none focus:border-indigo-500 text-indigo-600"
                       />
                       <Globe className="absolute left-4 top-4 text-slate-300" size={14} />
                     </div>
                   </div>

                   <button className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2">
                     <Zap size={14} /> Test Connection
                   </button>
                </div>
              </div>

              {/* --- ADD CUSTOM SOURCE --- */}
              <div className="pt-6 border-t border-slate-100">
                <button className="w-full p-5 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 hover:border-indigo-200 hover:text-indigo-500 transition-all flex flex-col items-center gap-2 group">
                  <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Connect Custom Database</span>
                  <p className="text-[9px] font-medium leading-tight">Connect MySQL, MongoDB, or <br/> Google Sheets directly</p>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default FlowSidebar;
                  
