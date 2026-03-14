import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, GripVertical, Link as LinkIcon } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  // Blocks safety check: data.blocks nahi hone par khali array rakho
  const blocks = data?.blocks || [];
  // Dynamic Name logic: "Message 1", "Message 2" automatic handle karega
  const nodeTitle = data?.title || "Message";

  return (
    <div className="bg-white border-[1.5px] border-slate-100 rounded-[1.5rem] shadow-sm w-[280px] overflow-hidden group font-sans transition-shadow hover:shadow-md">
      
      {/* Target Handle: Incoming messages ke liye */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 bg-slate-300 border-2 border-white !-left-1.5" 
      />

      {/* Header: Dito professional design */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/30">
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

      {/* Content Area: Blocks mapping */}
      <div className="p-4 space-y-3">
        {blocks.map((block) => (
          <div key={block.id}>
            {/* Text Message Block */}
            {block.type === 'text' && (
              <div className="p-3 bg-white border border-slate-100 rounded-xl text-[12px] text-slate-600 leading-relaxed shadow-sm min-h-[40px] whitespace-pre-wrap">
                {block.content || "Naya Message..."}
              </div>
            )}

            {/* Button Block Logic: Branching vs URL Link */}
            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className={`w-full py-2.5 px-4 rounded-full text-[11px] font-semibold text-center shadow-sm border flex items-center justify-center gap-2 transition-colors
                  ${block.subType === 'url' 
                    ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default' // URL Button Style
                    : 'bg-white border-indigo-100 text-indigo-500 hover:bg-indigo-50 cursor-pointer' // Reply Button Style
                  }`}>
                  
                  {/* URL icon sirf Link buttons ke liye dikhega */}
                  {block.subType === 'url' && <LinkIcon size={12} />}
                  {block.label || "New Button"}
                </div>
                
                {/* LOGIC: Sirf 'reply' type buttons par handle (wire) dikhega */}
                {block.subType === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={block.id} // Button-specific ID for branching
                    className="w-2.5 h-2.5 bg-slate-800 border-2 border-white !-right-1" 
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {/* Requirement: Faltu dashed "+ ADD BUTTON" hat gaya hai */}
      </div>
    </div>
  );
};

export default WhatsAppNode;
