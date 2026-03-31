import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  PlayCircle, 
  Database, 
  Cpu, 
  List, 
  ChevronRight,
  Zap
} from 'lucide-react';
import VariableManager from './VariableManager';

const FlowSidebar = ({ onAddNode }) => {
  const [isVarOpen, setIsVarOpen] = useState(false);

  // Desktop ke liye drag logic
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Elements Configuration
  const elements = [
    { 
      type: 'startNode', 
      label: 'Start Trigger', 
      desc: 'Automation Root', 
      icon: <PlayCircle size={20} />, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      type: 'whatsappNode', 
      label: 'Neural Message', 
      desc: 'Text & Buttons', 
      icon: <MessageSquare size={20} />, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-100' 
    },
    { 
      type: 'listNode', 
      label: 'List Menu', 
      desc: 'Dropdown (10 Rows)', 
      icon: <List size={20} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100' 
    }
  ];

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
            <Zap size={10} className="text-slate-200 fill-current" />
          </div>

          <div className="space-y-4">
            {elements.map((el) => (
              <div 
                key={el.type}
                draggable 
                onDragStart={(e) => onDragStart(e, el.type)}
                onClick={() => onAddNode(el.type)} // FIXED: Click to add logic for mobile
                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-pointer hover:shadow-xl hover:bg-white transition-all active:scale-95 group"
              >
                <div className={`p-2.5 ${el.bg} ${el.color} rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm`}>
                  {el.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{el.label}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{el.desc}</span>
                </div>
              </div>
            ))}
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

export default FlowSidebar;
    
