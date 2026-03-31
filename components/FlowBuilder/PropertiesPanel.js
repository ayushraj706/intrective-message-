import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, Type, Trash2, Plus, Zap, 
  Database, Upload, Loader2, Link, Eye, Smartphone 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [blocks, setBlocks] = useState(selectedNode.data.blocks || []);
  const [buttons, setButtons] = useState(selectedNode.data.buttons || []);
  const [customVars, setCustomVars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  // 1. VARIABLE SYNC: Sirf wahi dikhayega jo Businessman ne add kiya hai
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const fetchedVars = doc.data().customVariables || [];
        setCustomVars(fetchedVars);
      }
    });
    return () => unsub();
  }, []);

  // 2. CLOUDINARY UPLOAD LOGIC
  const handleMediaUpload = async (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset"); // Cloudinary Preset Name

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const updated = blocks.map(b => b.id === blockId ? { ...b, url: data.secure_url } : b);
      setBlocks(updated);
      onUpdate(selectedNode.id, { blocks: updated, buttons });
    } catch (e) { alert("Upload fail!"); }
    setUploading(false);
  };

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

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 bg-white z-10">
        <h3 className="text-xs font-black text-slate-800 uppercase italic">Neural <span className="text-indigo-600">Architect</span></h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32">
        {/* VARIABLE PICKER (Fixed: No extra variables) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Database size={12}/> Neural Variable Tags</label>
          <div className="flex flex-wrap gap-2">
            {customVars.map(v => (
              <button key={v.id} onClick={() => insertVariable(v.name)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                {`{{${v.name}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* MEDIA & TEXT BLOCKS */}
        {blocks.map((block) => (
          <div key={block.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.type} Block</span>
             </div>

             {block.type === 'text' ? (
               <textarea ref={textareaRef} value={block.content} onChange={(e) => {
                 const updated = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                 setBlocks(updated); onUpdate(selectedNode.id, { blocks: updated, buttons });
               }} className="w-full bg-white p-5 text-xs font-medium rounded-3xl border-none outline-none min-h-[140px] shadow-sm focus:ring-2 focus:ring-indigo-100" placeholder="Type your neural message..." />
             ) : (
               <div className="relative group overflow-hidden h-40 border-2 border-dashed border-slate-200 rounded-3xl bg-white flex flex-col items-center justify-center transition-all hover:border-indigo-400">
                  {block.url ? (
                    <img src={block.url} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" size={24}/>}
                      <span className="text-[9px] font-black text-slate-400 uppercase italic">Upload Media Header</span>
                    </div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleMediaUpload(e, block.id)} />
               </div>
             )}
          </div>
        ))}

        {/* BUTTONS (Interactive Logic) */}
        <div className="space-y-4 border-t pt-8">
           <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Interactive Buttons</label>
              <button onClick={() => {
                if (buttons.length < 3) {
                  const newBtns = [...buttons, { id: `btn_${Date.now()}`, type: 'reply', label: 'New Action', url: '' }];
                  setButtons(newBtns); onUpdate(selectedNode.id, { blocks, buttons: newBtns });
                }
              }} className="p-2 bg-indigo-600 text-white rounded-full hover:scale-95 transition-all"><Plus size={16}/></button>
           </div>
           
           <div className="space-y-3">
              {buttons.map(btn => (
                <div key={btn.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 group">
                   <div className="flex gap-3">
                      <input value={btn.label} onChange={(e) => {
                        const updated = buttons.map(b => b.id === btn.id ? { ...b, label: e.target.value } : b);
                        setButtons(updated); onUpdate(selectedNode.id, { blocks, buttons: updated });
                      }} className="flex-1 text-xs font-black uppercase outline-none border-b border-slate-50" />
                      <select value={btn.type} onChange={(e) => {
                        const updated = buttons.map(b => b.id === btn.id ? { ...b, type: e.target.value } : b);
                        setButtons(updated); onUpdate(selectedNode.id, { blocks, buttons: updated });
                      }} className="text-[9px] font-black uppercase bg-slate-100 rounded-lg px-2">
                         <option value="reply">Reply</option>
                         <option value="url">Link</option>
                      </select>
                   </div>
                   {btn.type === 'url' && (
                     <div className="flex items-center gap-2 bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100">
                        <Link size={12} className="text-indigo-400"/>
                        <input value={btn.url} onChange={(e) => {
                          const updated = buttons.map(b => b.id === btn.id ? { ...b, url: e.target.value } : b);
                          setButtons(updated); onUpdate(selectedNode.id, { blocks, buttons: updated });
                        }} className="text-[9px] font-mono bg-transparent outline-none w-full text-indigo-600" placeholder="https://..." />
                     </div>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* --- LIVE PREVIEW (WhatsApp Mockup) --- */}
        <div className="pt-10 border-t">
           <label className="text-[10px] font-black text-slate-400 uppercase mb-5 flex items-center gap-2"><Smartphone size={14}/> Live Neural Preview</label>
           <div className="bg-[#e5ddd5] p-6 rounded-[2.5rem] border-8 border-slate-900 shadow-2xl relative overflow-hidden h-[350px]">
              <div className="bg-white rounded-2xl p-3 shadow-md space-y-2 max-w-[85%] animate-in slide-in-from-bottom-4 duration-500">
                 {blocks.find(b => b.type === 'image')?.url && (
                   <img src={blocks.find(b => b.type === 'image').url} className="w-full h-32 object-cover rounded-xl" alt="Preview" />
                 )}
                 <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                   {blocks.find(b => b.type === 'text')?.content || "Waiting for content..."}
                 </p>
                 <div className="space-y-1.5 pt-2">
                   {buttons.map(btn => (
                     <div key={btn.id} className="w-full py-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-[10px] font-bold text-indigo-600 flex items-center justify-center gap-2">
                       {btn.type === 'url' && <Link size={10}/>} {btn.label}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t mt-auto">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
          <Trash2 size={14}/> Destroy Architecture Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
  
