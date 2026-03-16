import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Brain, Trash2, CheckCircle2, Bot, MessageSquare, Globe, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const AIIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  
  // Form States
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('You are a helpful assistant for BaseKey Business.');
  const [enabledPlatforms, setEnabledPlatforms] = useState({
    whatsapp: false,
    telegram: false,
    'telegram-api': false
  });

  const currentUserId = auth.currentUser?.uid;

  // 1. Saved Config Load karna
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(doc(db, "configs", currentUserId, "ai", "gemini"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        setApiKey(data.apiKey);
        setPrompt(data.instructions);
        setEnabledPlatforms(data.platforms || {});
      } else {
        setConfig(null);
      }
    });
    return () => unsub();
  }, [currentUserId]);

  const togglePlatform = (p) => {
    setEnabledPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
  };

  const handleSave = async () => {
    if (!apiKey) return toast.error("API Key zaroori hai!");
    setLoading(true);
    try {
      await setDoc(doc(db, "configs", currentUserId, "ai", "gemini"), {
        apiKey,
        instructions: prompt,
        platforms: enabledPlatforms,
        status: 'active',
        updatedAt: new Date()
      });
      toast.success("AI Settings updated successfully!");
    } catch (err) {
      toast.error("Failed to save AI config");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Kya aap AI connection delete karna chahte hain?")) {
      await deleteDoc(doc(db, "configs", currentUserId, "ai", "gemini"));
      setApiKey('');
      setEnabledPlatforms({ whatsapp: false, telegram: false, 'telegram-api': false });
      toast.info("AI settings deleted.");
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto bg-[#080808] min-h-screen text-white">
      <div className="mb-10">
        <h2 className="text-4xl font-black tracking-tighter italic">AI <span className="text-blue-500">Integration</span></h2>
        <p className="text-zinc-500 text-sm mt-2">Apne pasandida AI ko connect karein aur auto-reply manage karein.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Gemini Card */}
        <div className={`p-6 rounded-[2rem] border-2 transition-all ${config ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-zinc-900/50'}`}>
           <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
             <Brain className="text-blue-500" />
           </div>
           <h3 className="font-bold">Google Gemini</h3>
           <p className="text-[10px] text-zinc-500 mt-1">Smart & Fast responses via Google AI.</p>
           {config && <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-500 font-bold uppercase tracking-widest"><CheckCircle2 size={12}/> Connected</div>}
        </div>
        {/* Placeholder for ChatGPT */}
        <div className="p-6 rounded-[2rem] border-2 border-white/5 bg-zinc-900/10 opacity-40">
           <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4"><Bot className="text-green-500" /></div>
           <h3 className="font-bold text-zinc-400">OpenAI ChatGPT</h3>
        </div>
      </div>

      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="space-y-8">
          {/* API KEY */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">Your API Key</label>
            <input 
              type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key here..."
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* INSTRUCTIONS */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">System Instructions (Prompt)</label>
            <textarea 
              rows="4" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm resize-none"
            />
          </div>

          {/* PLATFORM SELECTION */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-4">Auto-Reply Enabled Platforms</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16}/>, color: 'hover:text-green-500' },
                { id: 'telegram', label: 'Telegram Bot', icon: <Bot size={16}/>, color: 'hover:text-blue-400' },
                { id: 'telegram-api', label: 'Telegram API', icon: <Globe size={16}/>, color: 'hover:text-blue-600' }
              ].map(p => (
                <div 
                  key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${enabledPlatforms[p.id] ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={enabledPlatforms[p.id] ? 'text-blue-500' : 'text-zinc-500'}>{p.icon}</span>
                    <span className="text-xs font-bold">{p.label}</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${enabledPlatforms[p.id] ? 'bg-blue-500 border-blue-500' : 'border-zinc-700'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={handleSave} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
              {config ? 'Update AI Neural Link' : 'Connect Neural Link'}
            </button>
            {config && (
              <button onClick={handleDelete} className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntegration;
