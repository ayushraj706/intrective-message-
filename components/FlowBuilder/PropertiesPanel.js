import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Upload, Loader2, Database, Zap, Sparkles, 
  Plus, Trash2, Link, Link2, ListPlus, Smartphone 
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PropertiesPanel = ({ selectedNode, onUpdate, onDelete, onClose, onStartConnect }) => {
  const [uploading, setUploading] = useState(false);
  const [customVars, setCustomVars] = useState([]);
  const bodyRef = useRef(null);
  const nodeData = selectedNode.data;

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "configs", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCustomVars(doc.data().customVariables || []);
    });
    return () => unsub();
  }, []);

  const sync = (updates) => {
    onUpdate(selectedNode.id, { ...nodeData, ...updates });
  };

  const handleMedia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "basekey_preset");
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const d = await res.json();
      sync({ header: { ...nodeData.header, url: d.secure_url, type: 'media' } });
    } catch (e) { alert("Upload Failed!"); }
    setUploading(false);
  };

  return (
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} className="w-[420px] bg-white border-l h-full flex flex-col shadow-2xl fixed right-0 top-0 z-[100] font-sans">
      
      {/* 1. HEADER */}
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <h3 className="text-xs font-black uppercase italic tracking-widest">Neural Editor</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all active:scale-90"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-slate-50/30 scrollbar-hide">
        
        {/* 2. NEURAL ROUTING ACTION */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase px-1">Neural Routing</label>
           <button 
             onClick={onStartConnect}
             className="w-full py-4 bg-indigo-600 text-white rounded-3xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
           >
             <Link2 size={16}/> Link to Another Node
           </button>
        </div>

        {/* 3. VARIABLE PICKER */}
        <div className="flex flex-wrap gap-2">
          {customVars.map(v => (
            <button key={v.id} onClick={() => sync({ body: (nodeData.body || "") + ` {{${v.name}}}` })} className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>

        {/* 4. MESSAGE CONTENT CARD (VISIBILITY FIX APPLIED HERE) */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => sync({ header: { ...nodeData.header, type: 'text' } })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${nodeData.header?.type === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Title</button>
              <button onClick={() => sync({ header: { ...nodeData.header, type: 'media' } })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${nodeData.header?.type === 'media' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Media</button>
           </div>

           {nodeData.header?.type === 'text' ? (
             <input 
               value={nodeData.header?.text || ''} 
               onChange={(e) => sync({ header: { ...nodeData.header, text: e.target.value } })} 
               // VISIBILITY FIX: Added text-slate-900 and font-black
               className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100 uppercase text-slate-900" 
               placeholder="Header Title..." 
             />
           ) : (
             <div className="relative h-40 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
                {nodeData.header?.url ? <img src={nodeData.header.url} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1">{uploading ? <Loader2 className="animate-spin text-indigo-600" /> : <Upload className="text-slate-300" />}<span className="text-[9px] font-black uppercase text-slate-400 italic">Media Content</span></div>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMedia} />
             </div>
           )}

           {/* MAIN BODY: Added text-slate-900 and solid font weight */}
           <textarea 
             ref={bodyRef} 
             value={nodeData.body || ''} 
             onChange={(e) => sync({ body: e.target.value })} 
             className="w-full bg-slate-50 p-5 text-xs font-bold rounded-3xl border-none outline-none min-h-[140px] focus:ring-2 focus:ring-indigo-100 leading-relaxed text-slate-900" 
             placeholder="Type neural message..." 
           />

           {/* FOOTER: Added text-slate-900 */}
           <input 
             value={nodeData.footer || ''} 
             onChange={(e) => sync({ footer: e.target.value })} 
             className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black text-slate-900 outline-none uppercase" 
             placeholder="Small gray footer..." 
           />
        </div>

        {/* 5. INTERACTIONS SECTION */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Zap size={12} className="text-yellow-500"/> Interactions</label>
           <div className="space-y-3">
              {(nodeData.buttons || []).map(btn => (
                <div key={btn.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg space-y-4">
                  <div className="flex items-center gap-3">
                     {/* BUTTON LABEL: Visibility fix */}
                     <input 
                       value={btn.label} 
                       onChange={(e) => sync({ buttons: nodeData.buttons.map(b => b.id === btn.id ? { ...b, label: e.target.value } : b) })} 
                       className="flex-1 text-[11px] font-black uppercase outline-none border-b border-slate-100 pb-1 text-slate-900" 
                       placeholder="Label" 
                     />
                     <button onClick={() => update({ buttons: nodeData.buttons.filter(b => b.id !== btn.id) })} className="text-red-400 hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              <button onClick={() => sync({ buttons: [...(nodeData.buttons || []), { id: `b_${Date.now()}`, label: 'New Button', type: 'reply' }] })} className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"><Plus size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Add Button</span></button>
           </div>
        </div>
      </div>
      
      {/* 6. DESTROY ACTION */}
      <div className="p-6 bg-white border-t mt-auto shadow-2xl">
         <button onClick={() => onDelete(selectedNode.id)} className="w-full py-4 bg-red-50 text-red-500 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
           <Trash2 size={16}/> Destroy Architecture
         </button>
      </div>
    </motion.aside>
  );
};

export default PropertiesPanel;
                 
