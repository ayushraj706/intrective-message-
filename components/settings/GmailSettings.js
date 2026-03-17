import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Code, Loader2 } from 'lucide-react';
import { db, auth } from '../../firebase'; // Path check kar lena
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function GmailSettings({ onBack }) {
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "configs", user.uid));
        if (snap.exists()) setHtmlTemplate(snap.data().gmail_template || '');
      }
    };
    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "configs", user.uid), { gmail_template: htmlTemplate }, { merge: true });
      alert("Gmail Template Saved! 🔥");
    }
    setIsSaving(false);
  };

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white">
      <button onClick={onBack} className="flex items-center text-zinc-500 hover:text-white mb-10 transition-colors">
        <ChevronLeft size={20} /> <span className="ml-2 font-mono text-xs uppercase tracking-widest">Back to Settings</span>
      </button>

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20"><Code className="text-red-500" /></div>
          <h3 className="text-2xl font-bold italic tracking-tight uppercase">Gmail <span className="text-zinc-500">HTML Template</span></h3>
        </div>

        <textarea 
          value={htmlTemplate}
          onChange={(e) => setHtmlTemplate(e.target.value)}
          placeholder="<html> Paste your Arc/AI generated code here... </html>"
          className="w-full h-[500px] bg-[#050505] border border-zinc-800 rounded-[2.5rem] p-8 font-mono text-sm text-zinc-400 focus:border-red-500/50 outline-none transition-all resize-none"
        />

        <div className="mt-8 flex justify-end">
          <button onClick={save} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-12 rounded-2xl flex items-center gap-2 shadow-xl shadow-red-900/20">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            SAVE CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
}

