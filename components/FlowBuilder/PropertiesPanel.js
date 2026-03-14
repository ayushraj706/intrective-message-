import React from 'react';
import { X, Type, Link, Trash2 } from 'lucide-react';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  if (!selectedNode) return null;

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full p-6 shadow-2xl animate-in slide-in-from-right duration-300 z-[100]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black dark:text-white italic">Settings</h3>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <X size={20} className="text-zinc-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Message Text</label>
          <textarea 
            value={selectedNode.data.label}
            onChange={(e) => onUpdate(selectedNode.id, e.target.value)}
            className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-xs dark:text-white outline-none focus:border-blue-500 transition-all min-h-[120px]"
            placeholder="What should the bot say?"
          />
        </div>

        {/* बटन टाइप चुनने का ऑप्शन */}
        {selectedNode.type === 'whatsappButtons' && (
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Actions</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 p-3 bg-blue-600/10 text-blue-500 rounded-xl text-[10px] font-bold">
                <Type size={14} /> Quick Reply
              </button>
              <button className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl text-[10px] font-bold">
                <Link size={14} /> URL Link
              </button>
            </div>
          </div>
        )}

        <div className="pt-8">
          <button 
            onClick={() => onDelete(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={16} /> Delete Block
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
          
