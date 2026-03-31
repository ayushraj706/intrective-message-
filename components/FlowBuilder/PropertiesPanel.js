import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Image as ImageIcon, Type, Trash2, Plus, Zap, 
  Database, Upload, Loader2, Link, MessageCircle 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [blocks, setBlocks] = useState(selectedNode.data.blocks || []);
  const [buttons, setButtons] = useState(selectedNode.data.buttons || []);
  const [customVars, setCustomVars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  const insertVariable = (varName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const text = blocks.find(b => b.type === 'text')?.content || "";
    const newText = text.substring(0, start) + `{{${varName}}}` + text.substring(start);
    
    const updated = blocks.map(b => b.type === 'text' ? { ...b, content: newText } : b);
    setBlocks(updated);
    onUpdate(selectedNode.id, { blocks: updated, buttons });
  };

  const addButton = () => {
    if (buttons.length >= 3) return alert("WhatsApp supports only 3 buttons!");
    const newBtn = { id: `btn_${Date.now()}`, type: 'reply', label: 'New Button', url: '' };
    const updated = [...buttons, newBtn];
    setButtons(updated);
    onUpdate(selectedNode.id, { blocks, buttons: updated });
  };

  const updateButton = (id, key, value) => {
    const updated = buttons.map(b => b.id === id ? { ...b, [key]: value } : b);
    setButtons(updated);
    onUpdate(selectedNode.id, { blocks, buttons: updated });
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-[400px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100]">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xs font-black text-slate-800 uppercase italic">Neural <span className="text-indigo-600">Architect</span></h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full shadow-sm"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32">
        {/* VARIABLE PICKER (No Delete here, just click) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Database size={12}/> Variable Picker</label>
          <div className="flex flex-wrap gap-2">
            {['name', 'phone'].concat(customVars.map(v => v.name)).map(v => (
              <button key={v} onClick={() => insertVariable(v)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* TEXT & MEDIA BLOCKS */}
        {blocks.map((block) => (
          <div key={block.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
             <span className="text-[10px] font-black text-slate-400 uppercase">{block.type} Content</span>
             {block.type === 'text' ? (
               <textarea ref={textareaRef} value={block.content} onChange={(e) => {
                 const updated = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                 setBlocks(updated); onUpdate(selectedNode.id, { blocks: updated, buttons });
               }} className="w-full bg-white p-4 text-xs font-medium rounded-2xl border-none outline-none min-h-[120px] shadow-sm" />
             ) : (
               <div className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-white">
                  <span className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest">Media Header Placeholder</span>
               </div>
             )}
          </div>
        ))}

        {/* BUTTON MANAGER (New Logic) */}
        <div className="space-y-4 border-t pt-8">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Zap size={14}/> Interactive Buttons</label>
            <button onClick={addButton} className="p-2 bg-indigo-600 text-white rounded-full"><Plus size={14}/></button>
          </div>
          
          <div className="space-y-3">
            {buttons.map((btn) => (
              <div key={btn.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex gap-2">
                  <input value={btn.label} onChange={(e) => updateButton(btn.id, 'label', e.target.value)} className="flex-1 text-[11px] font-bold outline-none border-b border-slate-100 pb-1" placeholder="Button Label" />
                  <select value={btn.type} onChange={(e) => updateButton(btn.id, 'type', e.target.value)} className="text-[9px] font-black uppercase bg-slate-50 rounded-lg px-2">
                    <option value="reply">Reply</option>
                    <option value="url">Link</option>
                  </select>
                </div>
                {btn.type === 'url' && (
                  <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                    <Link size={12} className="text-indigo-400"/>
                    <input value={btn.url} onChange={(e) => updateButton(btn.id, 'url', e.target.value)} className="bg-transparent text-[9px] font-mono outline-none w-full" placeholder="https://..." />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t mt-auto">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
          <Trash2 size={14}/> Destroy Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
