import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Smartphone, Trash2, GripVertical, Link, MessageCircle, Sparkles } from 'lucide-react';

const WhatsAppNode = ({ data, selected, id }) => {
  // Destructuring data for clean rendering
  const header = data?.header || { type: 'text', text: '' };
  const body = data?.body || '';
  const footer = data?.footer || '';
  const buttons = data?.buttons || [];

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-105' : 'scale-100'}`}>
      
      {/* Neural Glow Effect (Background) */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.2rem] blur opacity-10 transition duration-1000 ${selected ? 'opacity-30' : 'group-hover:opacity-20'}`}></div>

      <div className={`relative w-72 bg-white rounded-[2rem] border-2 shadow-2xl overflow-hidden transition-all ${selected ? 'border-indigo-500 shadow-indigo-200/50' : 'border-slate-100'}`}>
        
        {/* TOP HEADER: Control Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-600 rounded-lg text-white shadow-sm">
              <Sparkles size={12} />
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Neural <span className="text-indigo-600">Link</span></span>
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('deleteNode', { detail: id }));
              }}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
            <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing" />
          </div>
        </div>

        {/* --- WHATSAPP PREVIEW CONTENT --- */}
        <div className="p-4 bg-[#E5DDD5]/40 space-y-2">
          
          {/* Node Input Point */}
          <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !-left-1.5" />

          <div className="bg-white rounded-2xl p-2.5 shadow-sm space-y-2 relative border-l-4 border-indigo-400">
            {/* Header Content */}
            {header.type === 'media' && header.url ? (
              <img src={header.url} className="w-full h-24 object-cover rounded-xl mb-1 shadow-sm" alt="Header Media" />
            ) : header.text ? (
              <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight border-b border-slate-50 pb-1">{header.text}</p>
            ) : null}

            {/* Body Content */}
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
              {body || "Type your neural message in the properties panel..."}
            </p>

            {/* Footer Content */}
            {footer && (
              <p className="text-[8px] font-bold text-slate-400 italic mt-1">{footer}</p>
            )}
          </div>

          {/* Interactive Buttons (Neural Connection Points) */}
          <div className="space-y-1.5 pt-1">
            {buttons.map((btn) => (
              <div key={btn.id} className="relative group/btn">
                <div className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black text-center border border-indigo-100 shadow-md flex items-center justify-center gap-1.5">
                  {btn.type === 'url' ? <Link size={10}/> : <MessageCircle size={10}/>}
                  {btn.label || "Action Button"}
                </div>
                
                {/* Branching Handle: Only for Reply Buttons */}
                {btn.type === 'reply' && (
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={btn.id} 
                    className="!w-3 !h-3 !bg-indigo-600 !border-2 !border-white !-right-1.5 hover:!scale-125 transition-transform" 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="px-5 py-2 bg-slate-50 flex justify-between items-center border-t border-slate-100">
           <span className="text-[7px] font-mono text-slate-400 font-bold">STREAM_ID: {id.split('_')[1] || id}</span>
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default memo(WhatsAppNode);
