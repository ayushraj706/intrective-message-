import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, GripVertical, Image as ImageIcon, List, Smartphone } from 'lucide-react';

const WhatsAppNode = ({ data, selected }) => {
  const blocks = data?.blocks || [];

  return (
    <div className={`bg-white border-2 rounded-[1.2rem] shadow-xl w-[300px] overflow-hidden group transition-all ${selected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'}`}>
      
      {/* Target Handle */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-white !-left-1.5" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200">
            <Smartphone size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Base<span className="text-indigo-600">Key</span> Node</span>
        </div>
        <GripVertical size={16} className="text-slate-300 cursor-grab" />
      </div>

      {/* Preview Area (WhatsApp Style) */}
      <div className="p-4 bg-[#E5DDD5] bg-opacity-30 space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="animate-in fade-in slide-in-from-bottom-1">
            {/* Text Preview */}
            {block.type === 'text' && (
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm text-[12px] text-slate-700 relative border-l-4 border-indigo-500">
                {block.content || "Welcome to BaseKey Flow!"}
                <span className="block text-[8px] text-slate-400 mt-1 text-right italic">Neural Stream</span>
              </div>
            )}

            {/* Button Preview */}
            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-[11px] font-bold text-center border border-indigo-100 shadow-md hover:bg-indigo-50 transition-colors">
                  {block.subType === 'url' ? '🔗 ' : '🔘 '} {block.label || "New Button"}
                </div>
                
                {block.subType === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={block.id} 
                    className="w-3 h-3 bg-indigo-500 border-2 border-white !-right-1.5" 
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer: Node ID for Developer reference */}
      <div className="px-4 py-2 bg-white flex justify-between items-center opacity-50">
         <span className="text-[8px] font-mono uppercase">ID: {data?.title || 'NODE_WA'}</span>
         <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
         </div>
      </div>
    </div>
  );
};

export default WhatsAppNode;
