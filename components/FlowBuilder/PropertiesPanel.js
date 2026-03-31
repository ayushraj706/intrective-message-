import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ImageIcon, Type, Trash2, Plus, Zap, 
  Database, Upload, Loader2, Link, MessageCircle, Layout, Smartphone, AlignLeft
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  // Data Structure Logic
  const [header, setHeader] = useState(selectedNode.data.header || { type: 'text', text: '', url: '' });
  const [body, setBody] = useState(selectedNode.data.body || '');
  const [footer, setFooter] = useState(selectedNode.data.footer || '');
  const [buttons, setButtons] = useState(selectedNode.data.buttons || []);
  const [listRows, setListRows] = useState(selectedNode.data.listRows || []);
  
  const [customVars, setCustomVars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);

  // 1. Variable Sync (Strictly from Firebase)
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  // 2. Local State se Node Update karna
  const syncChanges = (newHeader, newBody, newFooter, newButtons, newListRows) => {
    onUpdate(selectedNode.id, { 
      header: newHeader || header, 
      body: newBody !== undefined ? newBody : body, 
      footer: newFooter !== undefined ? newFooter : footer, 
      buttons: newButtons || buttons,
      listRows: newListRows || listRows
    });
  };

  // 3. Media Upload (Cloudinary)
  const handleMediaUpload = async (e) => {
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
      const updatedHeader = { ...header, type: 'media', url: data.secure_url };
      setHeader(updatedHeader);
      syncChanges(updatedHeader);
    } catch (e) { alert("Upload Failed!"); }
    setUploading(false);
  };

  const insertVar = (name) => {
    const start = bodyRef.current.selectionStart;
    const newBody = body.substring(0, start) + `{{${name}}}` + body.substring(start);
    setBody(newBody);
    syncChanges(null, newBody);
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans">
      {/* Header Panel */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
        <div>
          <h3 className="text-[10px] font-black uppercase italic tracking-widest text-indigo-400">Neural Architect</h3>
          <p className="text-xs font-bold">{selectedNode.type === 'listNode' ? 'List Menu Config' : 'Interactive Message'}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/30">
        
        {/* 1. VARIABLE PICKER */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 italic tracking-tighter"><Database size={12}/> Variable Injection Tags</label>
          <div className="flex flex-wrap gap-2">
            {customVars.map(v => (
              <button key={v.id} onClick={() => insertVar(v.name)} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                {`{{${v.name}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. MESSAGE STRUCTURE (Title, Media, Body) */}
        <div className="space-y-4 bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
           {/* Header Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
              <button onClick={() => { const h = {...header, type:'text'}; setHeader(h); syncChanges(h); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${header.type === 'text' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Text Title</button>
              <button onClick={() => { const h = {...header, type:'media'}; setHeader(h); syncChanges(h); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${header.type === 'media' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Media Header</button>
           </div>

           {header.type === 'text' ? (
             <input value={header.text} onChange={(e) => { const h = {...header, text: e.target.value}; setHeader(h); syncChanges(h); }} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Header Title (e.g. Welcome!)" />
           ) : (
             <div className="relative group h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 hover:border-indigo-400 transition-all overflow-hidden">
                {header.url ? <img src={header.url} className="w-full h-full object-cover" /> : (
                  <div className="flex flex-col items-center gap-1">
                    {uploading ? <Loader2 className="animate-spin text-indigo-500" /> : <Upload className="text-slate-300" />}
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">Upload Media Content</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMediaUpload} />
             </div>
           )}

           {/* MAIN BODY */}
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase px-1">Message Body</label>
              <textarea ref={bodyRef} value={body} onChange={(e) => { setBody(e.target.value); syncChanges(null, e.target.value); }} className="w-full bg-slate-50 p-5 text-xs font-medium rounded-3xl border-none outline-none min-h-[140px] focus:ring-2 focus:ring-indigo-100" placeholder="Hi {{name}}, how can we help you today?" />
           </div>

           {/* FOOTER */}
           <input value={footer} onChange={(e) => { setFooter(e.target.value); syncChanges(null, null, e.target.value); }} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-bold text-slate-500 outline-none" placeholder="Footer Text (Optional)" />
        </div>

        {/* 3. INTERACTION MANAGER (Buttons / List) */}
        <div className="space-y-4 border-t pt-8">
           <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Zap size={14} className="text-indigo-600"/> {selectedNode.type === 'listNode' ? 'Menu Rows' : 'Action Buttons'}</label>
              <button onClick={() => {
                if (selectedNode.type === 'listNode') {
                  const newRows = [...listRows, { id: `row_${Date.now()}`, title: 'New Option', desc: '' }];
                  setListRows(newRows); syncChanges(null, null, null, null, newRows);
                } else if (buttons.length < 3) {
                  const newBtns = [...buttons, { id: `btn_${Date.now()}`, type: 'reply', label: 'New Action', url: '' }];
                  setButtons(newBtns); syncChanges(null, null, null, newBtns);
                }
              }} className="p-2 bg-slate-900 text-white rounded-full hover:scale-95 transition-all shadow-lg"><Plus size={16}/></button>
           </div>

           <div className="space-y-3">
              {selectedNode.type === 'listNode' ? (
                listRows.map(row => (
                  <div key={row.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2 group">
                    <input value={row.title} onChange={(e) => {
                      const updated = listRows.map(r => r.id === row.id ? { ...r, title: e.target.value } : r);
                      setListRows(updated); syncChanges(null, null, null, null, updated);
                    }} className="w-full text-xs font-black uppercase outline-none" placeholder="Row Title" />
                    <input value={row.desc} onChange={(e) => {
                      const updated = listRows.map(r => r.id === row.id ? { ...r, desc: e.target.value } : r);
                      setListRows(updated); syncChanges(null, null, null, null, updated);
                    }} className="w-full text-[9px] font-bold text-slate-400 outline-none" placeholder="Description (Optional)" />
                  </div>
                ))
              ) : (
                buttons.map(btn => (
                  <div key={btn.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 group transition-all hover:border-indigo-200">
                    <div className="flex gap-2">
                       <input value={btn.label} onChange={(e) => {
                         const updated = buttons.map(b => b.id === btn.id ? { ...b, label: e.target.value } : b);
                         setButtons(updated); syncChanges(null, null, null, updated);
                       }} className="flex-1 text-[11px] font-black uppercase outline-none border-b border-slate-50" placeholder="Button Name" />
                       <select value={btn.type} onChange={(e) => {
                         const updated = buttons.map(b => b.id === btn.id ? { ...b, type: e.target.value } : b);
                         setButtons(updated); syncChanges(null, null, null, updated);
                       }} className="text-[9px] font-black uppercase bg-slate-50 rounded-lg px-2 outline-none">
                          <option value="reply">Reply</option>
                          <option value="url">Link</option>
                       </select>
                       <button onClick={() => {
                         const updated = buttons.filter(b => b.id !== btn.id);
                         setButtons(updated); syncChanges(null, null, null, updated);
                       }} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                    </div>
                    {btn.type === 'url' && (
                      <input value={btn.url} onChange={(e) => {
                        const updated = buttons.map(b => b.id === btn.id ? { ...b, url: e.target.value } : b);
                        setButtons(updated); syncChanges(null, null, null, updated);
                      }} className="w-full text-[9px] font-mono p-2.5 bg-indigo-50/50 text-indigo-600 rounded-xl outline-none" placeholder="https://..." />
                    )}
                  </div>
                ))
              )}
           </div>
        </div>

        {/* --- SMART PREVIEW --- */}
        <div className="pt-10 border-t">
           <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 mb-6"><Smartphone size={14}/> Neural Live Preview</label>
           <div className="bg-[#E5DDD5] p-5 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden h-[400px]">
              <div className="bg-white rounded-2xl p-2.5 shadow-sm space-y-2 max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
                 {header.type === 'media' && header.url && <img src={header.url} className="w-full h-28 object-cover rounded-xl" />}
                 {header.type === 'text' && header.text && <p className="text-[11px] font-black text-slate-800 uppercase border-b pb-1">{header.text}</p>}
                 <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{body || "Neural content..."}</p>
                 {footer && <p className="text-[9px] text-slate-400 font-bold">{footer}</p>}
                 <div className="pt-2 space-y-1">
                    {selectedNode.type === 'listNode' ? (
                       <div className="w-full py-2 bg-slate-50 text-indigo-600 rounded-lg text-center text-[10px] font-black border border-slate-100 flex items-center justify-center gap-1">
                          <Layout size={10}/> View Menu
                       </div>
                    ) : (
                       buttons.map(b => <div key={b.id} className="w-full py-2 bg-slate-50 text-indigo-600 rounded-lg text-center text-[10px] font-black border border-slate-100">{b.label}</div>)
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-6 bg-white border-t mt-auto shadow-2xl">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-slate-50 text-red-500 border border-red-100 rounded-3xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
          <Trash2 size={14}/> Destroy Architecture Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                      
