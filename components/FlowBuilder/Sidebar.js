import React from 'react';
import { MessageSquare } from 'lucide-react';

const FlowSidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 p-6 z-50">
      <h3 className="text-xl font-black dark:text-white italic mb-1">BaseKey Studio</h3>
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-8">Visual Flow Editor</p>

      <div className="space-y-4">
        <div 
          draggable 
          onDragStart={(e) => onDragStart(e, 'whatsappNode')}
          className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-grab hover:border-blue-500 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-black uppercase dark:text-zinc-300">New Message</span>
        </div>
      </div>
    </div>
  );
};

export default FlowSidebar;
