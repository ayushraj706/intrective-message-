import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageSquare, PlayCircle, Database, Cpu } from 'lucide-react';
import VariableManager from './VariableManager'; // Nayi file import kari

const FlowSidebar = () => {
  const [isVarOpen, setIsVarOpen] = useState(false);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col relative overflow-hidden">
      {/* Clean Header */}
      <div className="p-6 border-b border-slate-50 bg-white">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-widest leading-none">
          BaseKey <span className="text-indigo-600">Studio</span>
        </h3>
        <div className="text-[8px] font-black text-slate-300 uppercase mt-2 tracking-tighter">
          Neural Architecture Engine v1.0
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {/* Nodes Section */}
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest opacity-50">Flow Elements</h4>
          <div className="space-y-4">
            <div 
              draggable onDragStart={(e) => onDragStart(e, 'startNode')} 
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-3xl cursor-grab hover:shadow-xl transition-all active:scale-95 group"
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                <PlayCircle size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Start Trigger</span>
            </div>

            <div 
              draggable onDragStart={(e) => onDragStart(e, 'whatsappNode')} 
              className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-3xl cursor-grab hover:shadow-xl transition-all active:scale-95 group"
            >
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <MessageSquare size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Neural Message</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => setIsVarOpen(true)} 
          className="w-full p-5 bg-slate-900 rounded-3xl flex items-center justify-between group hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200"
        >
          <div className="flex items-center gap-3 text-white">
            <Database size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase italic tracking-wider">Neural Variables</span>
          </div>
          <Cpu size={16} className="text-slate-500 group-hover:text-white" />
        </button>
      </div>

      {/* Full Overlay Variable Manager */}
      <AnimatePresence>
        {isVarOpen && <VariableManager onClose={() => setIsVarOpen(false)} />}
      </AnimatePresence>
    </aside>
  );
};

export default FlowSidebar;
