import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, Type, Layout, 
  Trash2, Plus, Zap, Database, ExternalLink, Cloud 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [blocks, setBlocks] = useState(selectedNode.data.blocks || []);
  const [variables, setVariables] = useState(['name', 'phone', 'time']); // Default system vars
  const textareaRef = useRef(null);

  // 1. Businessman ke save kiye hue variables load karo
  useEffect(() => {
    const fetchVars = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "configs", auth.currentUser.uid));
      if (snap.exists() && snap.data().customVariables) {
        setVariables(prev => [...prev, ...snap.data().customVariables.map(v => v.name)]);
      }
    };
    fetchVars();
  }, []);

  // 2. Variable ko cursor ki jagah insert karne ka logic
  const insertVariable = (varName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = blocks.find(b => b.type === 'text')?.content || "";
    
    const newText = text.substring(0, start) + ` {{${varName}}} ` + text.substring(end);
    
    const newBlocks = blocks.map(b => b.type === 'text' ? { ...b, content: newText } : b);
    setBlocks(newBlocks);
    onUpdate(selectedNode.id, newBlocks);
  };

  const addBlock = (type) => {
    const newBlock = { id: `blk_${Date.now()}`, type, content: '', url: '' };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    onUpdate(selectedNode.id, updated);
  };

  return (
    <motion.aside 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="w-96 bg-white border-l border-slate-100 h-full flex flex-col shadow-2xl z-[100]"
    >
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase italic">Node <span className="text-indigo-600">Config</span></h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">BaseKey Automation v1.0</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full shadow-sm transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* VARIABLE PICKER (Makkhan Logic) */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Database size={12}/> Neural Variables
          </label>
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <button 
                key={v} 
                onClick={() => insertVariable(v)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
              >
                {{v}}
              </button>
            ))}
          </div>
        </div>

        {/* MESSAGE BLOCKS */}
        <div className="space-y-6">
          {blocks.map((block, index) => (
            <div key={block.id} className="relative group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-slate-400 uppercase">
                {block.type === 'text' ? <Type size={14}/> : <ImageIcon size={14}/>}
                {block.type} Block {index + 1}
              </div>

              {block.type === 'text' ? (
                <textarea 
                  ref={textareaRef}
                  value={block.content}
                  onChange={(e) => {
                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                    setBlocks(newBlocks);
                    onUpdate(selectedNode.id, newBlocks);
                  }}
                  className="w-full bg-white p-4 text-xs font-medium text-slate-700 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none min-h-[120px] shadow-sm"
                  placeholder="Type your message here..."
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Cloud size={14} className="text-indigo-500"/>
                    <input 
                      placeholder="Cloudinary Image URL"
                      className="flex-1 bg-white p-3 text-[10px] font-mono rounded-xl border border-slate-200 outline-none"
                      value={block.url}
                      onChange={(e) => {
                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, url: e.target.value } : b);
                        setBlocks(newBlocks);
                        onUpdate(selectedNode.id, newBlocks);
                      }}
                    />
                  </div>
                  {block.url && (
                    <img src={block.url} className="w-full h-32 object-cover rounded-xl border border-white shadow-md" alt="Preview" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ADD COMPONENT BUTTONS */}
        <div className="pt-6 border-t border-slate-50">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block">Add Component</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => addBlock('text')} className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm">
              <Type size={20}/> <span className="text-[9px] font-black uppercase">Text Body</span>
            </button>
            <button onClick={() => addBlock('image')} className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-green-400 hover:text-green-600 transition-all shadow-sm">
              <ImageIcon size={20}/> <span className="text-[9px] font-black uppercase">Media Header</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-50 border-t flex gap-3">
        <button 
          onClick={() => onDelete(selectedNode.id)}
          className="flex-1 py-3 bg-white text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={14}/> Delete Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                    
