import React from 'react';
import { X, Type, Link, Trash2, MessageSquarePlus } from 'lucide-react';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  if (!selectedNode) return null;

  const blocks = selectedNode.data.blocks || [];

  // Block Update Handler
  const updateBlock = (blockId, key, value) => {
    const updatedBlocks = blocks.map(b => 
      b.id === blockId ? { ...b, [key]: value } : b
    );
    onUpdate(selectedNode.id, updatedBlocks);
  };

  // Add New Block Handler
  const addBlock = (type, subType = null) => {
    const newBlock = { 
      id: `blk_${Date.now()}`, 
      type, 
      ...(type === 'text' ? { content: '' } : { subType, label: 'New Button' })
    };
    onUpdate(selectedNode.id, [...blocks, newBlock]);
  };

  // Remove Block Handler
  const removeBlock = (blockId) => {
    const updatedBlocks = blocks.filter(b => b.id !== blockId);
    onUpdate(selectedNode.id, updatedBlocks);
  };

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 z-[100]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black dark:text-white italic">Settings</h3>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <X size={20} className="text-zinc-500" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Render Editors for Each Block */}
        {blocks.map((block, index) => (
          <div key={block.id} className="relative bg-zinc-50 dark:bg-black/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => removeBlock(block.id)}
              className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>

            {block.type === 'text' ? (
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Message Text {index + 1}</label>
                <textarea 
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs dark:text-white outline-none focus:border-blue-500 transition-all min-h-[80px]"
                  placeholder="What should the bot say?"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">
                  {block.subType === 'url' ? 'URL Button' : 'Quick Reply Button'}
                </label>
                <input 
                  type="text"
                  value={block.label}
                  onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs dark:text-white outline-none focus:border-blue-500 transition-all"
                  placeholder="Button Label"
                />
              </div>
            )}
          </div>
        ))}

        {/* Action Controls to Add New Elements */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-3">Add Elements</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => addBlock('button', 'reply')} className="flex items-center justify-center gap-2 p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-bold hover:bg-blue-600/20">
              <Type size={14} /> Quick Reply
            </button>
            <button onClick={() => addBlock('button', 'url')} className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 rounded-xl text-[10px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <Link size={14} /> URL Link
            </button>
          </div>
          <button onClick={() => addBlock('text')} className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 rounded-xl text-[10px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700">
            <MessageSquarePlus size={14} /> Add Text Block
          </button>
        </div>

        {/* Delete Entire Node */}
        <div className="pt-8">
          <button 
            onClick={() => onDelete(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={16} /> Delete Entire Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
          
