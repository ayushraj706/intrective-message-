import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Code, Loader2, Info } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function GmailSettings({ onBack }) {
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, "configs", auth.currentUser.uid));
        if (snap.exists()) setHtmlTemplate(snap.data().gmail_template || '');
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "configs", auth.currentUser.uid), {
        gmail_template: htmlTemplate
      }, { merge: true });
      alert("Neural Template Synchronized! ⚡");
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white animate-in slide-in-from-right duration-500">
      <button onClick={onBack} className="flex items-center text-zinc-600 hover:text-white mb-10 transition-all group font-mono text-[10px] uppercase tracking-[0.3em]">
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
        Return to Master Menu
      </button>

      <div className="max-w-5xl">
        <div className="flex items-center gap-5 mb-8">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <Code className="text-red-500" size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Gmail <span className="text-zinc-500">HTML Engine</span></h3>
            <div className="flex items-center gap-2 mt-1 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              <Info size={12} /> Use {"{{AI_REPLY}}"} placeholder in your code
            </div>
          </div>
        </div>

        <textarea 
          value={htmlTemplate}
          onChange={(e) => setHtmlTemplate(e.target.value)}
          placeholder="<html> Paste your professional HTML code here... </html>"
          className="w-full h-[550px] bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-10 font-mono text-sm text-zinc-500 focus:border-red-500/40 focus:text-zinc-300 outline-none transition-all resize-none shadow-inner"
        />

        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-14 rounded-2xl flex items-center gap-3 shadow-2xl shadow-red-900/20 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            UPDATE NEURAL NODE
          </button>
        </div>
      </div>
    </div>
  );
}
