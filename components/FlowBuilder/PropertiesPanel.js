import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2, Database, Zap, Smartphone, Sparkles, Plus, Trash2, Link, ListPlus } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [customVars, setCustomVars] = useState([]);
  const bodyRef = useRef(null);
  const data = selectedNode.data;

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  const sync = (updates) => onUpdate(selectedNode.id, updates);

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset");
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const d = await res.json();
      sync({ header: { ...data.header, type: 'media', url: d.secure_url } });
    } catch (e) { alert("Upload Failed!"); }
    setUploading(false);
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 z-20">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /><h3 className="text-xs font-black uppercase italic tracking-widest text-white">Neural Editor</h3></div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/30 scrollbar-hide">
        <div className="flex flex-wrap gap-2">
          {customVars.map(v => (
            <button key={v.id} onClick={() => {
              const start = bodyRef.current.selectionStart;
              const nb = (data.body || "").substring(0, start) + `{{${v.name}}}` + (data.body || "").substring(start);
              sync({ body: nb });
            }} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">{`{{${v.name}}}`}</button>
          ))}
        </div>

        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => sync({ header: { ...data.header, type: 'text' } })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${data.header?.type === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Title</button>
              <button onClick={() => sync({ header: { ...data.header, type: 'media' } })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${data.header?.type === 'media' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Media</button>
           </div>
           {data.header?.type === 'text' ? (
             <input value={data.header?.text || ''} onChange={(e) => sync({ header: { ...data.header, text: e.target.value } })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100 uppercase" placeholder="Header Title..." />
           ) : (
             <div className="relative h-40 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 overflow-hidden group">
                {data.header?.url ? <img src={data.header.url} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1">{uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" />}<span className="text-[9px] font-black uppercase text-slate-400">Media Content</span></div>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMediaUpload} />
             </div>
           )}
           <textarea ref={bodyRef} value={data.body || ''} onChange={(e) => sync({ body: e.target.value })} className="w-full bg-slate-50 p-5 text-xs font-medium rounded-3xl border-none outline-none min-h-[140px] focus:ring-2 focus:ring-indigo-100 leading-relaxed" placeholder="Type neural message..." />
           <input value={data.footer || ''} onChange={(e) => sync({ footer: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-bold text-slate-500 outline-none" placeholder="Footer (Optional)" />
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Zap size={12} className="text-yellow-500"/> Neural Interactions</label>
           <div className="space-y-3">
              {selectedNode.type === 'listNode' ? (data.listRows || []).map(row => (
                <div key={row.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2 relative group">
                  <button onClick={() => sync({ listRows: data.listRows.filter(r => r.id !== row.id) })} className="absolute -top-2 -right-2 p-1 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
                  <input value={row.title} onChange={(e) => sync({ listRows: data.listRows.map(r => r.id === row.id ? {...r, title: e.target.value} : r) })} className="w-full text-xs font-black uppercase outline-none" placeholder="Row Title" />
                  <input value={row.desc} onChange={(e) => sync({ listRows: data.listRows.map(r => r.id === row.id ? {...r, desc: e.target.value} : r) })} className="w-full text-[9px] font-bold text-slate-400 outline-none" placeholder="Description" />
                </div>
              )) : (data.buttons || []).map(btn => (
                <div key={btn.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg space-y-4">
                  <div className="flex items-center gap-3">
                     <input value={btn.label} onChange={(e) => sync({ buttons: data.buttons.map(b => b.id === btn.id ? {...b, label: e.target.value} : b) })} className="flex-1 text-[11px] font-black uppercase outline-none border-b border-slate-100 pb-1" />
                     <select value={btn.type} onChange={(e) => sync({ buttons: data.buttons.map(b => b.id === btn.id ? {...b, type: e.target.value} : b) })} className="text-[9px] font-black uppercase bg-slate-50 rounded-lg px-2 py-1 outline-none border-none cursor-pointer"><option value="reply">Reply</option><option value="url">URL Link</option></select>
                     <button onClick={() => sync({ buttons: data.buttons.filter(b => b.id !== btn.id) })} className="text-red-400"><Trash2 size={16}/></button>
                  </div>
                  {btn.type === 'url' && <div className="flex items-center gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2"><Link size={12} className="text-indigo-400"/><input value={btn.url} onChange={(e) => sync({ buttons: data.buttons.map(b => b.id === btn.id ? {...b, url: e.target.value} : b) })} className="w-full text-[9px] font-mono text-indigo-600 outline-none bg-transparent" placeholder="https://..." /></div>}
                </div>
              ))}
              <button onClick={() => { if(selectedNode.type === 'listNode') { sync({ listRows: [...(data.listRows || []), { id: `r_${Date.now()}`, title: 'New Option', desc: '' }] }); } else { if((data.buttons || []).length >= 3) return; sync({ buttons: [...(data.buttons || []), { id: `b_${Date.now()}`, type: 'reply', label: 'New Button' }] }); } }} className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group">{selectedNode.type === 'listNode' ? <ListPlus size={16}/> : <Plus size={16}/>} <span className="text-[10px] font-black uppercase tracking-widest">{selectedNode.type === 'listNode' ? 'Add Row' : 'Add Button'}</span></button>
           </div>
        </div>
      </div>
      <div className="p-6 bg-white border-t mt-auto shadow-2xl"><button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-red-50 text-red-500 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-sm"><Trash2 size={16}/> Destroy Architecture</button></div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                                                                            
