import React from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

const FlowSidebar = ({ onAddNode }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-white border-r border-slate-200 h-full p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800 italic tracking-tighter">BaseKey Studio</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Flow Editor</p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elements</label>
        
        {/* Click aur Drag dono support */}
        <div 
          draggable 
          onDragStart={(e) => onDragStart(e, 'whatsappNode')}
          onClick={() => onAddNode('whatsappNode')}
          className="p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex items-center gap-3 group active:scale-95"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-bold uppercase text-slate-600">New Message</span>
        </div>

        <div 
          draggable 
          onDragStart={(e) => onDragStart(e, 'whatsappNode')}
          onClick={() => onAddNode('whatsappNode')}
          className="p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-green-500 hover:shadow-md transition-all flex items-center gap-3 group active:scale-95"
        >
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <PlusCircle size={20} />
          </div>
          <span className="text-xs font-bold uppercase text-slate-600">Add Message</span>
        </div>
      </div>
    </div>
  );
};

export default FlowSidebar;
