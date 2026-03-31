import React, { useState } from 'react';
import { 
  MessageSquare, 
  PlayCircle, 
  Zap, 
  Database, 
  Plus, 
  CheckCircle, 
  X,
  Settings2
} from 'lucide-react';

const FlowSidebar = () => {
  const [showVariables, setShowVariables] = useState(false);

  // Default elements for the flow
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-full flex flex-col shadow-2xl shadow-slate-200/50 relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-widest">
          BaseKey <span className="text-indigo-600">Studio</span>
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Flow Architecture v1.0</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Core Elements Section */}
        <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-4">Core Elements</h4>
          <div className="space-y-3">
            <div 
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:border-indigo-400 hover:bg-white transition-all group"
              onDragStart={(event) => onDragStart(event, 'startNode')}
              draggable
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                <PlayCircle size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700">START TRIGGER</span>
            </div>

            <div 
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-grab hover:border-indigo-400 hover:bg-white transition-all group"
              onDragStart={(event) => onDragStart(event, 'messageNode')}
              draggable
            >
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <MessageSquare size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700">NEW MESSAGE</span>
            </div>
          </div>
        </div>

        {/* Neural Variables Toggle */}
        <div 
          onClick={() => setShowVariables(true)}
          className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-200"
        >
          <div className="flex items-center gap-3 text-white">
            <Database size={18} />
            <span className="text-xs font-bold uppercase tracking-tight">Neural Variables</span>
          </div>
        </div>
      </div>

      {/* --- NEURAL VARIABLES OVERLAY PANEL --- */}
      {showVariables && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-left duration-300">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase italic">Variable <span className="text-indigo-600">Settings</span></h3>
            <button onClick={() => setShowVariables(false)} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-500 uppercase">External API</span>
                <span className="text-[9px] font-bold text-green-500 flex items-center gap-1"><CheckCircle size={10}/> CONNECTED</span>
              </div>
              <input 
                type="text" 
                placeholder="Variable Name (e.g. balance)" 
                className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
              <input 
                type="text" 
                placeholder="https://api.yourstore.com/data" 
                className="w-full p-3 text-[10px] font-mono border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-indigo-600"
              />
              <button className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 transition-colors">
                Test Connection
              </button>
            </div>

            <button className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-bold flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-400">
              <Plus size={14} /> ADD CUSTOM SOURCE
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

// VERCEL ERROR FIX: Yeh line sabse zaroori hai
export default FlowSidebar;
