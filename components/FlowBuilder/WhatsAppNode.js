import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, GripVertical } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  const blocks = data?.blocks || [];
  const nodeTitle = data?.title || "Message"; // Dynamic Name (Message 1, 2 etc.)

  return (
    <div className="bg-white border-[1.5px] border-slate-100 rounded-[1.5rem] shadow-sm w-[280px] overflow-hidden group font-sans transition-shadow hover:shadow-md">
      
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 bg-slate-300 border-2 border-white !-left-1.5" 
      />

      {/* Header: Dynamic Title support */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 rounded text-indigo-500">
            <Send size={12} className="rotate-45" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            {nodeTitle}
          </span>
        </div>
        <GripVertical size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors cursor-grab" />
      </div>

      <div className="p-4 space-y-3">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'text' && (
              <div className="p-3 bg-white border border-slate-100 rounded-xl text-[12px] text-slate-600 leading-relaxed shadow-sm min-h-[40px] whitespace-pre-wrap">
                {block.content || "Naya Message..."}
              </div>
            )}

            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="w-full py-2.5 px-4 bg-white border border-indigo-100 text-indigo-500 rounded-full text-[11px] font-semibold text-center shadow-sm">
                  {block.label || "New Button"}
                </div>
                {block.subType === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={block.id} 
                    className="w-2.5 h-2.5 bg-slate-800 border-2 border-white !-right-1" 
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {/* Dashed button removed as per request */}
      </div>
    </div>
  );
};

export default WhatsAppNode;
