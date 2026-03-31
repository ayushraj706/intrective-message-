import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2, Database, Zap, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose }) => {
  const [header, setHeader] = useState(selectedNode.data.header || { type: 'text', text: '' });
  const [body, setBody] = useState(selectedNode.data.body || '');
  const [footer, setFooter] = useState(selectedNode.data.footer || '');
  const [buttons, setButtons] = useState(selectedNode.data.buttons || []);
  const [uploading, setUploading] = useState(false);
  const [customVars, setCustomVars] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  // APPLY BUTTON LOGIC
  const handleApply = () => {
    onUpdate(selectedNode.id, { header, body, footer, buttons });
  };

  const handleMedia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const d = await res.json();
    setHeader({ ...header, type: 'media', url: d.secure_url });
    setUploading(false);
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /><h3 className="text-xs font-black uppercase italic">Neural Editor</h3></div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 bg-slate-50/30 scrollbar-hide">
        <div className="flex flex-wrap gap-2">
          {customVars.map(v => (
            <button key={v.id} onClick={() => setBody(prev => prev + ` {{${v.name}}}`)} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 shadow-sm">{`{{${v.name}}}`}</button>
          ))}
        </div>

        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setHeader({...header, type:'text'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${header.type === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Title</button>
              <button onClick={() => setHeader({...header, type:'media'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl ${header.type === 'media' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Media</button>
           </div>

           {header.type === 'text' ? (
             <input value={header.text || ''} onChange={(e) => setHeader({...header, text: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Header Title..." />
           ) : (
             <div className="relative h-40 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
                {header.url ? <img src={header.url} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1">{uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" />}<span className="text-[9px] font-black uppercase text-slate-400 italic tracking-tighter">Photo Media</span></div>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMedia} />
             </div>
           )}

           <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full bg-slate-50 p-5 text-xs font-medium rounded-3xl border-none outline-none min-h-[140px] focus:ring-2 focus:ring-indigo-100 leading-relaxed" placeholder="Type message body..." />
           <input value={footer} onChange={(e) => setFooter(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-bold text-slate-500 outline-none" placeholder="Small gray footer text..." />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest"><Zap size={12} className="inline mr-1 text-yellow-500"/> Interactions</label>
          {buttons.map((btn) => (
            <div key={btn.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-3">
              <input value={btn.label} onChange={(e) => setButtons(buttons.map(b => b.id === btn.id ? {...b, label: e.target.value} : b))} className="flex-1 text-[11px] font-black uppercase outline-none border-b border-slate-50" placeholder="Label" />
              <button onClick={() => setButtons(buttons.filter(b => b.id !== btn.id))} className="text-red-400"><Trash2 size={16}/></button>
            </div>
          ))}
          <button onClick={() => setButtons([...buttons, { id: `b_${Date.now()}`, label: 'New Action', type: 'reply' }])} className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 group"><Plus size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Add Button</span></button>
        </div>
      </div>
      
      <div className="p-6 bg-white border-t mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        <button onClick={handleApply} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100">
          <CheckCircle2 size={16}/> Apply Changes to Canvas
        </button>
        <button onClick={() => onDelete(selectedNode.id)} className="w-full py-3 text-red-400 text-[9px] font-black uppercase hover:text-red-600 transition-all">Destroy Node</button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
            
