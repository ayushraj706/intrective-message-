import React, { useState } from 'react';
import { MessageSquare, PlayCircle, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const FlowSidebar = ({ onAddNode, isCollapsed, setIsCollapsed }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`bg-white border-r border-slate-200 h-full flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-72'}`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 shadow-md z-[100] text-slate-400 hover:text-indigo-600 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 ${isCollapsed ? 'hidden' : 'block'}`}>
        <h3 className="text-xl font-bold text-slate-800 italic tracking-tighter">BaseKey Studio</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Flow Architecture</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-4">
        {!isCollapsed && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Core Elements</label>}
        
        {/* START TRIGGER (Naya Button) */}
        <div 
          draggable 
          onDragStart={(e) => onDragStart(e, 'startNode')}
          onClick={() => onAddNode('startNode')}
          className="p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-green-500 hover:shadow-lg transition-all flex items-center gap-3 active:scale-95 group"
          title="Start Node"
        >
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200 shrink-0">
            <PlayCircle size={20} />
          </div>
          {!isCollapsed && <span className="text-xs font-bold uppercase text-slate-600">Start Trigger</span>}
        </div>

        {/* MESSAGE NODE */}
        <div 
          draggable 
          onDragStart={(e) => onDragStart(e, 'whatsappNode')}
          onClick={() => onAddNode('whatsappNode')}
          className="p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-3 active:scale-95 group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
            <MessageSquare size={20} />
          </div>
          {!isCollapsed && <span className="text-xs font-bold uppercase text-slate-600">New Message</span>}
        </div>
      </div>
    </div>
  );
};

export default FlowSidebar;
