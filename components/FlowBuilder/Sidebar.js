import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  PlayCircle, 
  Database, 
  Cpu, 
  List, 
  ChevronRight 
} from 'lucide-react';
import VariableManager from './VariableManager';

const FlowSidebar = () => {
  const [isVarOpen, setIsVarOpen] = useState(false);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col relative overflow-hidden font-sans">
      
      {/* --- NEURAL HEADER --- */}
      <div className="p-6 border-b border-slate-50 bg-white">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-widest leading-none">
          BaseKey <span className="text-indigo-600">Studio</span>
        </h3>
        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Neural Engine Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white scrollbar-hide">
        
        {/* --- FLOW ELEMENTS SECTION --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Flow Elements</h4>
            <Zap size={10} className="text-slate-200" />
          </div>

          <div className="space-y-4">
            {/* 1. START TRIGGER NODE */}
            <div 
              draggable onDragStart={(e) => onDragStart(e, 'startNode')} 
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-grab hover:shadow-xl hover:bg-white transition-all active:scale-95 group"
            >
              <div className="p-2.5 bg-green-100 text-green-600 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm">
                <PlayCircle size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Start Trigger</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Automation Root</span>
              </div>
            </div>

            {/* 2. NEURAL MESSAGE NODE */}
            <div 
              draggable onDragStart={(e) => onDragStart(e, 'whatsappNode')} 
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-grab hover:shadow-xl hover:bg-white transition-all active:scale-95 group"
            >
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                <MessageSquare size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Neural Message</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Text & Buttons</span>
              </div>
            </div>

            {/* 3. LIST MESSAGE NODE (NEW FEATURE) */}
            <div 
              draggable onDragStart={(e) => onDragStart(e, 'listNode')} 
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-grab hover:shadow-xl hover:bg-white transition-all active:scale-95 group"
            >
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <List size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">List Menu</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Dropdown with 10 rows</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- NEURAL VARIABLES ACTION --- */}
        <div className="pt-4">
          <button 
            onClick={() => setIsVarOpen(true)} 
            className="w-full p-5 bg-slate-900 rounded-[2rem] flex items-center justify-between group hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200"
          >
            <div className="flex items-center gap-3 text-white">
              <Database size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black uppercase italic tracking-wider">Neural Variables</span>
            </div>
            <div className="p-1 bg-slate-800 rounded-full group-hover:bg-indigo-500 transition-colors">
              <ChevronRight size={14} className="text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* --- VARIABLE MANAGER OVERLAY --- */}
      <AnimatePresence>
        {isVarOpen && <VariableManager onClose={() => setIsVarOpen(false)} />}
      </AnimatePresence>
    </aside>
  );
};

// Internal Helper for sub-elements
const Zap = ({ size, className }) => (
  <svg 
    width={size} height={size} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z" />
  </svg>
);

export default FlowSidebar;
