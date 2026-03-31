import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { List, ChevronRight } from 'lucide-react';

const ListNode = ({ data }) => {
  return (
    <div className="group relative">
      {/* Neural Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative w-64 bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List size={14} className="text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase italic">List Menu</span>
          </div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </div>

        {/* Content Preview */}
        <div className="p-5 space-y-3">
          <p className="text-[11px] font-bold text-slate-800 line-clamp-2">
            {data.blocks?.[0]?.content || "Select an option..."}
          </p>
          
          {/* Mock List Button */}
          <div className="w-full py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-2 text-indigo-600">
            <span className="text-[9px] font-black uppercase tracking-widest">
              {data.listButton || "View Options"}
            </span>
            <ChevronRight size={12} />
          </div>
        </div>

        {/* Bottom Handles (Har Row ke liye ek connection point) */}
        <div className="bg-slate-50 p-2 flex justify-center gap-2 border-t border-slate-100">
           {(data.rows || []).map((row, i) => (
             <div key={row.id} className="relative">
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={row.id}
                  style={{ left: '50%', background: '#f59e0b', width: 8, height: 8, border: '2px solid white' }}
                />
                <span className="text-[6px] font-bold text-slate-400 absolute -top-4 left-1/2 -translate-x-1/2 uppercase tracking-tighter">
                  R{i+1}
                </span>
             </div>
           ))}
        </div>
      </div>
      
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white" />
    </div>
  );
};

export default memo(ListNode);

