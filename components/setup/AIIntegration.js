import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Brain, Trash2, CheckCircle2, Bot, MessageSquare, Globe, Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AIIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  
  // Form States
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('You are a helpful assistant for BaseKey Business.');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [enabledPlatforms, setEnabledPlatforms] = useState({
    whatsapp: false,
    telegram: false,
    'telegram-api': false
  });

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  // 1. Saved Config Load karna (Real-time)
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(doc(db, "configs", currentUserId, "ai", "gemini"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        setApiKey(data.apiKey || '');
        setPrompt(data.instructions || '');
        setSelectedModel(data.model || 'gemini-1.5-flash');
        setEnabledPlatforms(data.platforms || { whatsapp: false, telegram: false, 'telegram-api': false });
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
    if (!apiKey) return toast.error("Bhai, Gemini API Key toh dalo!");
    setLoading(true);
    try {
      await setDoc(doc(db, "configs", currentUserId, "ai", "gemini"), {
        apiKey,
        instructions: prompt,
        platforms: enabledPlatforms,
        model: selectedModel,
        status: 'active',
        updatedAt: new Date()
      });
      toast.success("Neural Core Settings Updated!");
    } catch (err) {
      toast.error("Failed to save AI config");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Kya aap AI connection delete karna chahte hain?")) {
      await deleteDoc(doc(db, "configs", currentUserId, "ai", "gemini"));
      setApiKey('');
      setPrompt('You are a helpful assistant for BaseKey Business.');
      setEnabledPlatforms({ whatsapp: false, telegram: false, 'telegram-api': false });
      toast.info("AI settings removed.");
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto bg-[#080808] min-h-screen text-white transition-all duration-500">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-blue-500 animate-pulse" size={24} />
            <h2 className="text-4xl font-black tracking-tighter italic uppercase">AI <span className="text-blue-500">Neural Link</span></h2>
        </div>
        <p className="text-zinc-500 text-sm font-medium">Manage your Gemini AI brain and platform automation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Gemini Card */}
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden ${config ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-zinc-900/30'}`}>
           <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
             <Brain className="text-blue-500" size={28} />
           </div>
           <h3 className="text-xl font-bold mb-2">Google Gemini</h3>
           <p className="text-xs text-zinc-500 leading-relaxed mb-6">Connect BaseKey to Google's most advanced AI models for human-like responses.</p>
           {config && (
             <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] bg-blue-500/10 w-fit px-4 py-2 rounded-full">
               <CheckCircle2 size={12}/> Connection Active
             </div>
           )}
        </div>

        {/* ChatGPT Placeholder */}
        <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-transparent opacity-30 grayscale cursor-not-allowed">
           <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6"><Bot className="text-zinc-500" size={28}/></div>
           <h3 className="text-xl font-bold mb-2 text-zinc-500">OpenAI ChatGPT</h3>
           <p className="text-xs text-zinc-600 font-mono">Status: Coming Soon...</p>
        </div>
      </div>

      <div className="bg-[#111] p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-10">
        
        {/* API KEY SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">Neural API Key</label>
              <input 
                type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste Gemini Pro API Key..."
                className="w-full bg-black/50 border border-white/5 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-mono tracking-widest"
              />
            </div>

            {/* MODEL SELECTION SECTION */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">Select AI Model</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'gemini-1.5-flash', label: 'Flash' },
                  { id: 'gemini-1.5-pro', label: 'Pro' },
                  { id: 'auto', label: 'Auto' }
                ].map(m => (
                  <button 
                    key={m.id} onClick={() => setSelectedModel(m.id)}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedModel === m.id ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-black/40 text-zinc-600'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">System Instructions (Context)</label>
            <textarea 
              rows="7" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI how to behave (e.g., 'You are a helpful business assistant')..."
              className="w-full bg-black/50 border border-white/5 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* PLATFORM SELECTION */}
        <div className="pt-6 border-t border-white/5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-6">Enable Auto-Reply For Platforms</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: 'whatsapp', label: 'WhatsApp API', icon: <MessageSquare size={18}/> },
              { id: 'telegram', label: 'Telegram Bot', icon: <Bot size={18}/> },
              { id: 'telegram-api', label: 'Telegram Client', icon: <Globe size={18}/> }
            ].map(p => (
              <div 
                key={p.id} onClick={() => togglePlatform(p.id)}
                className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${enabledPlatforms[p.id] ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' : 'bg-black/40 border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${enabledPlatforms[p.id] ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                    {p.icon}
                  </div>
                  <span className={`text-xs font-bold ${enabledPlatforms[p.id] ? 'text-white' : 'text-zinc-500'}`}>{p.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${enabledPlatforms[p.id] ? 'bg-blue-600 border-blue-600' : 'border-zinc-700'}`}>
                   {enabledPlatforms[p.id] && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SAVE & DELETE ACTIONS */}
        <div className="flex items-center gap-5 pt-8">
          <button 
            onClick={handleSave} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
            {config ? 'Update Neural Link' : 'Initialize AI Link'}
          </button>
          
          {config && (
            <button 
                onClick={handleDelete} 
                className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                title="Disconnect AI"
            >
              <Trash2 size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIIntegration;
          
