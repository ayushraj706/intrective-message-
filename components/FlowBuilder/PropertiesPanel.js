import React from 'react';
import { X, Type, Link, Trash2, Plus } from 'lucide-react';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  if (!selectedNode) return null;
  const blocks = selectedNode.data.blocks || [];

  // Naya element add karne ka logic
  const addBlock = (type, subType = 'reply') => {
    const newBlock = { 
      id: `blk_${Date.now()}`, 
      type, 
      subType, 
      label: subType === 'url' ? 'Open Website' : 'Click Me',
      url: subType === 'url' ? 'https://' : '' // Sirf URL type ke liye
    };
    onUpdate(selectedNode.id, [...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    onUpdate(selectedNode.id, newBlocks);
  };

  const removeBlock = (id) => {
    onUpdate(selectedNode.id, blocks.filter(b => b.id !== id));
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full p-6 shadow-2xl overflow-y-auto z-[100]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800 italic">Settings</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
      </div>

      <div className="space-y-6">
        {blocks.map((block, idx) => (
          <div key={block.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
            <button onClick={() => removeBlock(block.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>

            {block.type === 'text' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Text {idx + 1}</label>
                <textarea 
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {block.subType === 'url' ? '🔗 URL Link Button' : '🔘 Quick Reply Button'}
                </label>
                <input 
                  type="text" 
                  value={block.label} 
                  placeholder="Button Display Name"
                  onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
                {block.subType === 'url' && (
                  <input 
                    type="text" 
                    value={block.url} 
                    placeholder="https://example.com"
                    onChange={(e) => updateBlock(block.id, 'url', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-mono outline-none text-indigo-500"
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Add Elements</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addBlock('button', 'reply')} className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold hover:bg-indigo-100 transition-all">
              <Type size={14} /> + Quick Reply
            </button>
            <button onClick={() => addBlock('button', 'url')} className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-all">
              <Link size={14} /> + URL Link
            </button>
          </div>
          <button onClick={() => addBlock('text')} className="w-full p-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold border-2 border-dashed border-slate-200 hover:border-indigo-200 hover:text-indigo-400 transition-all">
            + Add Text Block
          </button>
        </div>

        <button onClick={() => onDelete(selectedNode.id)} className="w-full mt-8 p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all">
          <Trash2 size={16} className="inline mr-2" /> Delete Entire Message
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
                      
