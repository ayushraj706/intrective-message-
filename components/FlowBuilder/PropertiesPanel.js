import React from 'react';
import { X, Type, Link, Trash2, Smartphone, Layers } from 'lucide-react';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  if (!selectedNode) return null;
  const blocks = selectedNode.data.blocks || [];

  const handleFieldUpdate = (blockId, field, value) => {
    const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b);
    onUpdate(selectedNode.id, updatedBlocks);
  };

  const addBlock = (type, subType = 'reply') => {
    const newBlock = { 
      id: `blk_${Date.now()}`, 
      type, 
      subType, 
      label: subType === 'url' ? 'Visit Website' : 'New Button',
      content: type === 'text' ? 'Type your neural response...' : '',
      url: subType === 'url' ? 'https://' : '' 
    };
    onUpdate(selectedNode.id, [...blocks, newBlock]);
  };

  return (
    <div className="w-85 bg-white border-l border-slate-200 h-full p-0 shadow-2xl flex flex-col z-[100] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Node <span className="text-indigo-600">Config</span></h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">BaseKey Automation v1.0</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-indigo-600"><X size={20} /></button>
      </div>

      {/* Scroll Area with extra padding for mobile keyboard */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-48">
        {blocks.map((block, idx) => (
          <div key={block.id} className="group relative bg-slate-50 rounded-3xl border border-slate-100 p-5 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
            <button 
              onClick={() => onUpdate(selectedNode.id, blocks.filter(b => b.id !== block.id))}
              className="absolute -top-2 -right-2 bg-white text-slate-300 hover:text-red-500 shadow-lg border border-slate-100 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <Trash2 size={12} />
            </button>

            {block.type === 'text' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Type size={14} className="text-indigo-500" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Block {idx + 1}</label>
                </div>
                {/* FIXED: added text-slate-900 and font-medium */}
                <textarea 
                  value={block.content || ''}
                  onChange={(e) => handleFieldUpdate(block.id, 'content', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[14px] text-slate-900 font-medium outline-none focus:ring-2 ring-indigo-500/10 focus:border-indigo-500 min-h-[120px] resize-none transition-all"
                  placeholder="What should the bot say?"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {block.subType === 'url' ? <Link size={14} className="text-emerald-500" /> : <Smartphone size={14} className="text-indigo-500" />}
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {block.subType === 'url' ? 'External Link' : 'Interactive Button'}
                  </label>
                </div>
                {/* FIXED: added text-slate-900 and font-bold */}
                <input 
                  type="text" 
                  value={block.label || ''} 
                  onChange={(e) => handleFieldUpdate(block.id, 'label', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
                  placeholder="Button Text"
                />
                {block.subType === 'url' && (
                  <input 
                    type="text" 
                    value={block.url || ''} 
                    onChange={(e) => handleFieldUpdate(block.id, 'url', e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-[10px] font-mono outline-none text-indigo-600 focus:bg-white"
                    placeholder="https://example.com"
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layers size={12} /> Add Component
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => addBlock('button', 'reply')} className="flex flex-col items-center gap-2 p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm group">
              <Smartphone size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold">BUTTON</span>
            </button>
            <button onClick={() => addBlock('button', 'url')} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] hover:bg-emerald-600 hover:text-white transition-all shadow-sm group">
              <Link size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold">LINK</span>
            </button>
          </div>
          <button onClick={() => addBlock('text')} className="w-full mt-3 p-4 bg-white text-slate-500 rounded-[1.5rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:text-indigo-400 transition-all font-bold text-[10px]">
            + ADD TEXT BLOCK
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm flex items-center justify-center gap-2">
          <Trash2 size={16} /> DELETE NODE
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
