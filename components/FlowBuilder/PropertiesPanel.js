import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, Type, Trash2, Plus, Zap, 
  Database, Upload, Loader2, Globe, Edit3, Save, Check, ExternalLink 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [blocks, setBlocks] = useState(selectedNode.data.blocks || []);
  const [customVars, setCustomVars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingVarId, setEditingVarId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const textareaRef = useRef(null);

  // 1. Real-time Variables Sync (Taaki Sidebar ki zaroorat na pade)
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setCustomVars(doc.data().customVariables || []);
      }
    });
    return () => unsub();
  }, []);

  // 2. Variable URL Update Logic (Manage Section)
  const updateVariableUrl = async (varId) => {
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      const updatedList = customVars.map(v => 
        v.id === varId ? { ...v, url: editUrl } : v
      );
      await updateDoc(userRef, { customVariables: updatedList });
      setEditingVarId(null);
    } catch (e) { alert("Update failed!"); }
  };

  // 3. Variable Delete Logic
  const deleteVariable = async (varId) => {
    if(!window.confirm("Variable uda dein?")) return;
    try {
      const userRef = doc(db, "configs", auth.currentUser.uid);
      const updatedList = customVars.filter(v => v.id !== varId);
      await updateDoc(userRef, { customVariables: updatedList });
    } catch (e) { alert("Delete failed!"); }
  };

  // 4. Cloudinary Media Upload
  const handleUpload = async (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset");

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
    } catch (e) { alert("Media Upload failed!"); }
    setUploading(false);
  };

  const insertVariable = (varName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = blocks.find(b => b.type === 'text')?.content || "";
    const newText = text.substring(0, start) + `{{${varName}}}` + text.substring(end);
    const updated = blocks.map(b => b.type === 'text' ? { ...b, content: newText } : b);
    setBlocks(updated);
    onUpdate(selectedNode.id, updated);
  };

  return (
    <motion.aside 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="w-[400px] bg-white border-l border-slate-100 h-full flex flex-col shadow-2xl z-[100] fixed right-0 top-0"
    >
      {/* Panel Header */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase italic tracking-wider">Neural <span className="text-indigo-600">Architect</span></h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Node ID: {selectedNode.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full shadow-sm transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32 scrollbar-hide">
        
        {/* --- SECTION 1: NEURAL VARIABLE MANAGER --- */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
            <Database size={14}/> Neural Integration Manager
          </label>
          
          <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            {customVars.length === 0 && <p className="text-[10px] text-slate-400 font-bold text-center py-2">No custom variables connected.</p>}
            
            {customVars.map((v) => (
              <div key={v.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={() => insertVariable(v.name)}
                    className="text-[10px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    {{v.name}}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingVarId(v.id); setEditUrl(v.url); }} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit3 size={14}/></button>
                    <button onClick={() => deleteVariable(v.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                </div>

                {editingVarId === v.id ? (
                  <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                    <input 
                      value={editUrl} onChange={(e) => setEditUrl(e.target.value)}
                      className="flex-1 bg-slate-50 p-2 text-[9px] font-mono border border-indigo-200 rounded-lg outline-none"
                    />
                    <button onClick={() => updateVariableUrl(v.id)} className="p-2 bg-green-500 text-white rounded-lg"><Check size={14}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono truncate">
                    <Globe size={10}/> {v.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- SECTION 2: CONTENT BLOCKS --- */}
        <div className="space-y-6 border-t pt-8">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
            <Zap size={14} className="text-yellow-500"/> Message Construction
          </label>
          
          {blocks.map((block) => (
            <div key={block.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.type} Element</span>
              </div>

              {block.type === 'text' ? (
                <textarea 
                  ref={textareaRef} value={block.content}
                  onChange={(e) => {
                    const updated = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                    setBlocks(updated); onUpdate(selectedNode.id, updated);
                  }}
                  className="w-full bg-slate-50 p-4 text-xs font-medium text-slate-700 rounded-2xl border border-slate-100 outline-none min-h-[150px] focus:bg-white focus:border-indigo-500 transition-all"
                  placeholder="Neural message text..."
                />
              ) : (
                <div className="relative h-40 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50 overflow-hidden group">
                  {block.url ? (
                    <>
                      <img src={block.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Media</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" size={24}/>}
                      <span className="text-[9px] font-black text-slate-400 uppercase">Cloudinary Upload</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, block.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-50 border-t flex gap-3 sticky bottom-0">
        <button onClick={() => onDelete(selectedNode.id)} className="flex-1 py-4 bg-white text-red-500 border border-red-100 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
          <Trash2 size={14}/> Destroy Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                        
