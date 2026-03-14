import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, GripVertical, Plus } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  // Blocks safety check
  const blocks = data?.blocks || [];

  return (
    <div className="bg-white border-[1.5px] border-slate-100 rounded-[1.5rem] shadow-sm w-[280px] overflow-hidden group font-sans transition-shadow hover:shadow-md">
      
      {/* Target Handle (Left Side - Incoming) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 bg-slate-300 border-2 border-white !-left-1.5" 
      />

      {/* Header: Dito screenshot jaisa */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 rounded text-indigo-500">
            <Send size={12} className="rotate-45" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Message</span>
        </div>
        <GripVertical size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors cursor-grab" />
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-3">
        {blocks.map((block) => (
          <div key={block.id}>
            {/* Text Block Styling */}
            {block.type === 'text' && (
              <div className="p-3 bg-white border border-slate-100 rounded-xl text-[12px] text-slate-600 leading-relaxed shadow-sm min-h-[40px] whitespace-pre-wrap">
                {block.content || "Welcome to BaseKey!"}
              </div>
            )}

            {/* Button Block Styling: Branching support ke saath */}
            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="w-full py-2.5 px-4 bg-white border border-indigo-100 text-indigo-500 rounded-full text-[11px] font-semibold text-center hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer">
                  {block.label || "New Button"}
                </div>
                
                {/* Connection Handle: URL buttons par nahi dikhega */}
                {block.subType === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={block.id} // Button-specific ID for routing
                    className="w-2.5 h-2.5 bg-slate-800 border-2 border-white !-right-1" 
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Dashed "+ ADD BUTTON" Area: Visual placeholder */}
        <div className="mt-2 py-2.5 border-2 border-dashed border-slate-50 rounded-full flex items-center justify-center gap-2 text-slate-300 hover:border-indigo-100 hover:text-indigo-300 transition-all cursor-pointer">
          <Plus size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">Add Button</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNode;
