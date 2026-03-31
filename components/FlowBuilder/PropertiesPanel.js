import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ImageIcon, Type, Trash2, Plus, Zap, 
  Database, Upload, Loader2, Link, Smartphone, Layout, ListPlus, Sparkles
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const nodeData = selectedNode?.data || {};
  
  // States with strict defaults to prevent crashes
  const [header, setHeader] = useState(nodeData.header || { type: 'text', text: '', url: '' });
  const [body, setBody] = useState(nodeData.body || '');
  const [footer, setFooter] = useState(nodeData.footer || '');
  const [buttons, setButtons] = useState(nodeData.buttons || []);
  const [listRows, setListRows] = useState(nodeData.listRows || []);
  
  const [customVars, setCustomVars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);

  // Node Change par data sync (Anti-Crash)
  useEffect(() => {
    if (selectedNode) {
      setHeader(selectedNode.data?.header || { type: 'text', text: '', url: '' });
      setBody(selectedNode.data?.body || '');
      setFooter(selectedNode.data?.footer || '');
      setButtons(selectedNode.data?.buttons || []);
      setListRows(selectedNode.data?.listRows || []);
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  const sync = (updates) => {
    onUpdate(selectedNode.id, {
      ...nodeData,
      header: updates.header || header,
      body: updates.body !== undefined ? updates.body : body,
      footer: updates.footer !== undefined ? updates.footer : footer,
      buttons: updates.buttons || buttons,
      listRows: updates.listRows || listRows
    });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
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
      const newHeader = { ...header, type: 'media', url: data.secure_url };
      setHeader(newHeader);
      sync({ header: newHeader });
    } catch (e) { alert("Upload Failed!"); }
    setUploading(false);
  };

  const insertVar = (name) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + `{{${name}}}` + body.substring(end);
    setBody(newBody);
    sync({ body: newBody });
  };

  return (
    <motion.aside 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
      className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans"
    >
      {/* Header Panel */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 z-20">
        <div>
          <h3 className="text-[10px] font-black uppercase italic tracking-widest text-indigo-400 flex items-center gap-2">
            <Sparkles size={12}/> Neural Architect
          </h3>
          <p className="text-xs font-bold">{selectedNode.type === 'listNode' ? 'LIST MENU CONFIG' : 'INTERACTIVE MESSAGE'}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/30 scrollbar-hide">
        
        {/* 1. VARIABLE INJECTION */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest px-1">
            <Database size={12}/> Data Variables
          </label>
          <div className="flex flex-wrap gap-2">
            {customVars.map(v => (
              <button key={v.id} onClick={() => insertVar(v.name)} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                {`{{${v.name}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. MESSAGE STRUCTURE CARD */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-6">
           {/* Header Selector */}
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => { const h = {...header, type:'text'}; setHeader(h); sync({header: h}); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${header.type === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Text Header</button>
              <button onClick={() => { const h = {...header, type:'media'}; setHeader(h); sync({header: h}); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${header.type === 'media' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Media Header</button>
           </div>

           {header.type === 'text' ? (
             <input value={header.text} onChange={(e) => { const h = {...header, text: e.target.value}; setHeader(h); sync({header: h}); }} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100" placeholder="e.g. ORDER UPDATE" />
           ) : (
             <div className="relative h-40 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 hover:border-indigo-400 transition-all overflow-hidden group">
                {header.url ? (
                  <img src={header.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {uploading ? <Loader2 className="animate-spin text-indigo-500" /> : <Upload className="text-slate-300" />}
                    <span className="text-[9px] font-black text-slate-400 uppercase italic">Media Content</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMediaUpload} />
             </div>
           )}

           {/* BODY SECTION */}
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase px-2">Main Message Body</label>
              <textarea ref={bodyRef} value={body} onChange={(e) => { setBody(e.target.value); sync({ body: e.target.value }); }} className="w-full bg-slate-50 p-5 text-xs font-medium rounded-3xl border-none outline-none min-h-[140px] focus:ring-2 focus:ring-indigo-100 leading-relaxed" placeholder="Type your message content here..." />
           </div>

           {/* FOOTER SECTION */}
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase px-2">Footer Label</label>
              <input value={footer} onChange={(e) => { setFooter(e.target.value); sync({ footer: e.target.value }); }} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-bold text-slate-500 outline-none" placeholder="Small gray text (Optional)" />
           </div>
        </div>

        {/* 3. INTERACTIVE ACTIONS (New Modular Layout) */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest"><Zap size={12} className="inline mr-1 text-yellow-500"/> Interactions</label>
           
           <div className="space-y-3">
              {selectedNode.type === 'listNode' ? (
                listRows.map((row, idx) => (
                  <div key={row.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2 group relative">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-indigo-500 uppercase">Row #{idx + 1}</span>
                       <button onClick={() => { const up = listRows.filter(r => r.id !== row.id); setListRows(up); sync({listRows: up}); }} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                    <input value={row.title} onChange={(e) => { const up = listRows.map(r => r.id === row.id ? {...r, title: e.target.value} : r); setListRows(up); sync({listRows: up}); }} className="w-full text-xs font-black uppercase outline-none" placeholder="Option Title" />
                    <input value={row.desc} onChange={(e) => { const up = listRows.map(r => r.id === row.id ? {...r, desc: e.target.value} : r); setListRows(up); sync({listRows: up}); }} className="w-full text-[9px] font-medium text-slate-400 outline-none" placeholder="Short Description" />
                  </div>
                ))
              ) : (
                buttons.map((btn, idx) => (
                  <div key={btn.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 space-y-4 group">
                    <div className="flex items-center gap-3">
                       <input value={btn.label} onChange={(e) => { const up = buttons.map(b => b.id === btn.id ? {...b, label: e.target.value} : b); setButtons(up); sync({buttons: up}); }} className="flex-1 text-[11px] font-black uppercase outline-none border-b border-slate-100 pb-1" placeholder="Button Text" />
                       <select value={btn.type} onChange={(e) => { const up = buttons.map(b => b.id === btn.id ? {...b, type: e.target.value} : b); setButtons(up); sync({buttons: up}); }} className="text-[9px] font-black uppercase bg-slate-50 rounded-lg px-2 py-1 outline-none">
                          <option value="reply">Reply</option>
                          <option value="url">URL</option>
                       </select>
                       <button onClick={() => { const up = buttons.filter(b => b.id !== btn.id); setButtons(up); sync({buttons: up}); }} className="p-1 text-slate-300 hover:text-red-500"><X size={16}/></button>
                    </div>
                    {btn.type === 'url' && (
                      <div className="flex items-center gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                        <Link size={12} className="text-indigo-400"/>
                        <input value={btn.url} onChange={(e) => { const up = buttons.map(b => b.id === btn.id ? {...b, url: e.target.value} : b); setButtons(up); sync({buttons: up}); }} className="w-full text-[9px] font-mono text-indigo-600 outline-none bg-transparent" placeholder="https://..." />
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>

           {/* NEW PROFESSIONAL ADD BUTTON */}
           <button 
             onClick={() => {
                if (selectedNode.type === 'listNode') {
                  if (listRows.length >= 10) return;
                  const nr = [...listRows, { id: `row_${Date.now()}`, title: '', desc: '' }];
                  setListRows(nr); sync({ listRows: nr });
                } else {
                  if (buttons.length >= 3) return;
                  const nb = [...buttons, { id: `btn_${Date.now()}`, type: 'reply', label: '', url: '' }];
                  setButtons(nb); sync({ buttons: nb });
                }
             }}
             className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"
           >
             <div className="p-1 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors">
               {selectedNode.type === 'listNode' ? <ListPlus size={16}/> : <Plus size={16}/>}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest">
               {selectedNode.type === 'listNode' ? 'Add Menu Row' : 'Add Action Button'}
             </span>
           </button>
        </div>

        {/* --- LIVE WHATSAPP PREVIEW --- */}
        <div className="pt-10 border-t">
           <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 mb-6 tracking-widest px-2"><Smartphone size={14}/> Live Neural Preview</label>
           <div className="bg-[#E5DDD5] p-6 rounded-[3.5rem] border-[10px] border-slate-900 shadow-2xl relative h-[450px] overflow-hidden">
              <div className="bg-white rounded-2xl p-3 shadow-md space-y-2 max-w-[90%] relative animate-in zoom-in-95">
                 <div className="absolute -left-2 top-0 w-4 h-4 bg-white clip-path-triangle rotate-45" />
                 {header.type === 'media' && header.url && <img src={header.url} className="w-full h-32 object-cover rounded-xl" />}
                 {header.type === 'text' && header.text && <p className="text-[11px] font-black text-slate-800 uppercase border-b pb-1 border-slate-50">{header.text}</p>}
                 <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{body || "Neural content..."}</p>
                 {footer && <p className="text-[9px] text-slate-400 font-bold italic">{footer}</p>}
                 
                 <div className="pt-2 border-t border-slate-50 space-y-1.5">
                    {selectedNode.type === 'listNode' ? (
                       <div className="w-full py-2.5 bg-slate-50 text-indigo-600 rounded-xl text-center text-[10px] font-black border border-slate-100 flex items-center justify-center gap-2 shadow-sm">
                          <Layout size={12}/> View Menu
                       </div>
                    ) : (
                       buttons.map(b => <div key={b.id} className="w-full py-2.5 bg-slate-50 text-indigo-600 rounded-xl text-center text-[10px] font-black border border-slate-100 shadow-sm flex items-center justify-center gap-2">{b.type === 'url' && <Link size={10}/>} {b.label || "Action Button"}</div>)
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t mt-auto">
        <button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-red-50 text-red-500 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
          <Trash2 size={16}/> Destroy Architecture Node
        </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                                      
