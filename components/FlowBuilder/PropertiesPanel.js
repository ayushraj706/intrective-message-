import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Type, Trash2, Plus, Zap, Database, Upload, Loader2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [blocks, setBlocks] = useState(selectedNode.data.blocks || []);
  const [variables, setVariables] = useState(['name', 'phone', 'time']); 
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  // 1. Real-time Variables Load (Sidebar se connect)
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists() && doc.data().customVariables) {
        const custom = doc.data().customVariables.map(v => v.name);
        setVariables(['name', 'phone', 'time', ...custom]);
      }
    });
    return () => unsub();
  }, []);

  // 2. Cloudinary Upload Logic
  const handleUpload = async (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset"); // Cloudinary preset name

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const updated = blocks.map(b => b.id === blockId ? { ...b, url: data.secure_url } : b);
      setBlocks(updated);
      onUpdate(selectedNode.id, updated);
    } catch (e) { alert("Upload fail!"); }
    setUploading(false);
  };

  const insertVariable = (varName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = blocks.find(b => b.type === 'text')?.content || "";
    const newText = text.substring(0, start) + ` {{${varName}}} ` + text.substring(end);
    const updated = blocks.map(b => b.type === 'text' ? { ...b, content: newText } : b);
    setBlocks(updated);
    onUpdate(selectedNode.id, updated);
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-96 bg-white border-l border-slate-100 h-full flex flex-col shadow-2xl z-[100]">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xs font-black text-slate-800 uppercase italic">Node <span className="text-indigo-600">Config</span></h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* NEURAL VARIABLE CHIPS */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Database size={12}/> Neural Variables</label>
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <button key={v} onClick={() => insertVariable(v)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                {{v}}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT BLOCKS */}
        <div className="space-y-6">
          {blocks.map((block) => (
            <div key={block.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-3">{block.type} Block</div>
              {block.type === 'text' ? (
                <textarea ref={textareaRef} value={block.content} onChange={(e) => {
                  const updated = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                  setBlocks(updated); onUpdate(selectedNode.id, updated);
                }} className="w-full bg-white p-4 text-xs font-medium rounded-xl border border-slate-200 outline-none min-h-[120px]" />
              ) : (
                <div className="relative h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-white overflow-hidden group">
                  {block.url ? <img src={block.url} className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center">
                      {uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" />}
                      <span className="text-[9px] font-black text-slate-400 mt-2 uppercase">Media Upload</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, block.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t flex gap-3">
        <button onClick={() => onDelete(selectedNode.id)} className="flex-1 py-3 bg-white text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-2">
          <Trash2 size={14}/> Delete Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
          
