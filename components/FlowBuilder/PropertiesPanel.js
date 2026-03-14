import React from 'react';
import { X, Type, Link, Trash2 } from 'lucide-react';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  if (!selectedNode) return null;
  const blocks = selectedNode.data.blocks || [];

  // 1. Real-time typing handler
  const handleFieldUpdate = (blockId, field, value) => {
    const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b);
    onUpdate(selectedNode.id, updatedBlocks);
  };

  // 2. Element addition
  const addBlock = (type, subType = 'reply') => {
    const newBlock = { 
      id: `blk_${Date.now()}`, 
      type, 
      subType, 
      label: subType === 'url' ? 'Open Website' : 'New Button',
      content: type === 'text' ? 'Type your message...' : '',
      url: subType === 'url' ? 'https://' : '' 
    };
    onUpdate(selectedNode.id, [...blocks, newBlock]);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full p-6 shadow-2xl overflow-y-auto z-[100] animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800 italic uppercase">Settings</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
      </div>

      <div className="space-y-6">
        {blocks.map((block, idx) => (
          <div key={block.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:border-indigo-100">
            {/* Taj Mahal Logic: Individual block delete */}
            <button 
              onClick={() => onUpdate(selectedNode.id, blocks.filter(b => b.id !== block.id))}
              className="absolute -top-2 -right-2 bg-white text-slate-300 hover:text-red-500 shadow-md border border-slate-100 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={12} />
            </button>

            {block.type === 'text' ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Message Text {idx + 1}</label>
                <textarea 
                  value={block.content}
                  onChange={(e) => handleFieldUpdate(block.id, 'content', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 min-h-[100px]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {block.subType === 'url' ? '🔗 URL Link' : '🔘 Quick Reply'}
                </label>
                <input 
                  type="text" 
                  value={block.label} 
                  placeholder="Button Label"
                  onChange={(e) => handleFieldUpdate(block.id, 'label', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
                {block.subType === 'url' && (
                  <input 
                    type="text" 
                    value={block.url} 
                    placeholder="https://yourlink.com"
                    onChange={(e) => handleFieldUpdate(block.id, 'url', e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-[10px] font-mono outline-none text-indigo-600"
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Add Elements</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addBlock('button', 'reply')} className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all">
              <Type size={14} /> + Quick Reply
            </button>
            <button onClick={() => addBlock('button', 'url')} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-800 hover:text-white transition-all">
              <Link size={14} /> + URL Link
            </button>
          </div>
          <button onClick={() => addBlock('text')} className="w-full p-3 bg-white text-slate-400 rounded-xl text-[10px] font-bold border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:text-indigo-400 transition-all">
            + Add Text Block
          </button>
        </div>

        <button onClick={() => onDelete(selectedNode.id)} className="w-full mt-8 p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm">
          <Trash2 size={16} className="inline-block mr-2" /> Delete Entire Message
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
                    
