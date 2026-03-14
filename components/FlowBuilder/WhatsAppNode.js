import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, GripVertical, Plus } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  const blocks = data?.blocks || [];

  return (
    <div className="bg-white border-[1px] border-slate-200 rounded-2xl shadow-sm w-72 overflow-hidden font-sans">
      {/* Target Handle - Left Side */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-300 border-2 border-white" />

      {/* Header Area */}
      <div className="flex items-center justify-between p-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
            <Send size={14} />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 tracking-tight uppercase">Message</span>
        </div>
        <GripVertical size={16} className="text-slate-300 cursor-grab" />
      </div>

      {/* Body Area */}
      <div className="p-4 space-y-3">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'text' && (
              <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed shadow-sm">
                {block.content || "Write your message..."}
              </div>
            )}

            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="w-full py-2.5 px-4 bg-white border border-slate-200 text-indigo-600 rounded-full text-[11px] font-medium text-center shadow-sm">
                  {block.label}
                </div>
                {/* Source Handle - Only for Buttons */}
                {block.subType === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={block.id} 
                    className="w-3 h-3 bg-indigo-500 border-2 border-white -right-4" 
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Button Placeholder (Visual Only) */}
        <div className="mt-2 py-2 border-2 border-dashed border-slate-100 rounded-full flex items-center justify-center gap-2 text-slate-300 group hover:border-indigo-200 hover:text-indigo-400 transition-all cursor-pointer">
          <Plus size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Add Button</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNode;
