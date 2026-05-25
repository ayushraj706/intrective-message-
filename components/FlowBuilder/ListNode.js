import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { List, Sparkles } from 'lucide-react';

const ListNode = ({ data, selected }) => {
  const { header, body, listRows, listButton } = data;

  return (
    <div className={`relative transition-all ${selected ? 'scale-105' : ''}`}>
      <div className={`w-72 bg-white rounded-[2rem] border-2 shadow-2xl overflow-hidden ${selected ? 'border-amber-500' : 'border-slate-100'}`}>
        <Handle type="target" position={Position.Top} className="!bg-amber-500" />
        
        <div className="px-5 py-3 bg-amber-50 border-b flex items-center gap-2">
          <List size={14} className="text-amber-600" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Menu System</span>
        </div>

        <div className="p-4 space-y-3 bg-slate-50/50">
          <div className="bg-white p-3 rounded-2xl shadow-sm border-l-4 border-amber-400">
            <p className="text-[11px] text-slate-700 font-bold">{body || "Select an option..."}</p>
          </div>

          {/* Har Row ke liye ek alag Connection Point */}
          <div className="space-y-2">
            {(listRows || []).map((row, index) => (
              <div key={row.id} className="relative group">
                <div className="w-full py-2 px-3 bg-white border border-amber-100 rounded-xl text-[10px] font-black text-amber-600 shadow-sm flex justify-between items-center">
                  {row.title}
                </div>
                {/* YEH HAI MAGIC: Har row ka apna handle */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={row.id} // Row ki ID handle se link ho gayi
                  className="!w-3 !h-3 !bg-amber-500 !-right-1.5 border-2 border-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ListNode);
