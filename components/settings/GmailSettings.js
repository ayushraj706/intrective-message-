import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Code, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function GmailSettings({ onBack }) {
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [isPreview, setIsPreview] = useState(false);
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

  // Preview ke liye {{AI_REPLY}} ko dummy text se badalna
  const getPreviewHTML = () => {
    const dummyText = "Bhai, ye ek AI generate kiya hua sample reply hai. BaseKey Neural Link ekdum makkhan chal raha hai! 🚀";
    return htmlTemplate.replace('{{AI_REPLY}}', dummyText);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "configs", auth.currentUser.uid), { gmail_template: htmlTemplate }, { merge: true });
      alert("Neural Template Synchronized! ⚡");
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  return (
    <div className="p-6 md:p-12 bg-[#080808] min-h-screen text-white animate-in slide-in-from-right duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={onBack} className="flex items-center text-zinc-600 hover:text-white mb-4 transition-all group font-mono text-[10px] uppercase tracking-[0.3em]">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Menu
          </button>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter">Gmail <span className="text-blue-500">HTML Engine</span></h3>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsPreview(!isPreview)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all border ${isPreview ? 'bg-zinc-800 border-white/20' : 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20'}`}
          >
            {isPreview ? <><EyeOff size={16} /> EDIT CODE</> : <><Eye size={16} /> LIVE PREVIEW</>}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-red-900/20 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} SAVE
          </button>
        </div>
      </div>

      {/* Main Working Area */}
      <div className="grid grid-cols-1 gap-6">
        {!isPreview ? (
          <div className="relative group">
            <div className="absolute top-5 right-5 text-zinc-700 group-hover:text-red-500/50 transition-colors"><Code size={24} /></div>
            <textarea 
              value={htmlTemplate}
              onChange={(e) => setHtmlTemplate(e.target.value)}
              placeholder="<html> Paste your professional code here... </html>"
              className="w-full h-[600px] bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-10 font-mono text-sm text-zinc-500 focus:border-red-500/40 focus:text-zinc-300 outline-none transition-all resize-none shadow-2xl"
            />
          </div>
        ) : (
          <div className="w-full h-[600px] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full text-[10px] font-mono text-zinc-500 border border-white/5 z-10 uppercase tracking-widest">Neural Render Mode</div>
            <iframe 
              srcDoc={getPreviewHTML()} 
              title="Template Preview"
              className="w-full h-full border-none bg-white"
            />
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
        <Sparkles className="text-blue-500 mt-1" size={18} />
        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
          <span className="text-blue-500 font-bold">PRO TIP:</span> Preview mode mein humne sample AI response insert kiya hai. Asli mail bhejte waqt Gemini AI ka real response wahan "Inject" ho jayega. Template mein <span className="text-white font-mono">{"{{AI_REPLY}}"}</span> placeholder ka hona zaroori hai.
        </p>
      </div>
    </div>
  );
}
