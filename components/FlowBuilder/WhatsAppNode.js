import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Smartphone, Trash2, GripVertical, Link, MessageCircle, Sparkles } from 'lucide-react';

const WhatsAppNode = ({ data, selected, id }) => {
  const { header, body, footer, buttons } = data;

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-105' : 'scale-100'}`}>
      <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.2rem] blur opacity-10 ${selected ? 'opacity-30' : 'group-hover:opacity-20'}`}></div>
      <div className={`relative w-72 bg-white rounded-[2rem] border-2 shadow-2xl overflow-hidden ${selected ? 'border-indigo-500 shadow-indigo-200' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-600 rounded-lg text-white"><Sparkles size={12} /></div>
            <span className="text-[9px] font-black text-slate-500 uppercase italic">Neural Link</span>
          </div>
          <GripVertical size={16} className="text-slate-300 cursor-grab" />
        </div>
        <div className="p-4 bg-[#E5DDD5]/40 space-y-2">
          <Handle type="target" position={Position.Left} className="!bg-indigo-500 !-left-1.5" />
          <div className="bg-white rounded-2xl p-2.5 shadow-sm space-y-2 relative border-l-4 border-indigo-400">
            {header?.type === 'media' && header.url ? (
              <img src={header.url} className="w-full h-24 object-cover rounded-xl" />
            ) : header?.text ? (
              <p className="text-[9px] font-black text-slate-800 uppercase border-b pb-1">{header.text}</p>
            ) : null}
            <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{body || "Typing..."}</p>
            {footer && <p className="text-[8px] font-bold text-slate-400 italic">{footer}</p>}
          </div>
          <div className="space-y-1.5 pt-1">
            {(buttons || []).map((btn) => (
              <div key={btn.id} className="relative">
                <div className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black text-center border border-indigo-100 shadow-sm flex items-center justify-center gap-1">
                  {btn.type === 'url' ? <Link size={10}/> : <MessageCircle size={10}/>} {btn.label || "Action"}
                </div>
                {btn.type !== 'url' && <Handle type="source" position={Position.Right} id={btn.id} className="!bg-indigo-600 !-right-1.5" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WhatsAppNode);
