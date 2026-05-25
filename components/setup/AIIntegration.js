import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
// Added Facebook and Instagram icons here
import { Brain, Trash2, CheckCircle2, Bot, MessageSquare, Globe, Loader2, Save, Sparkles, Info, ShieldAlert, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

const AIIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [apiMeta, setApiMeta] = useState(null);
  
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('You are a helpful assistant for BaseKey Business.');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  
  // Updated enabledPlatforms to include FB and Insta
  const [enabledPlatforms, setEnabledPlatforms] = useState({
    whatsapp: false,
    telegram: false,
    'telegram-api': false,
    facebook: false,
    instagram: false
  });

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(doc(db, "configs", currentUserId, "ai", "gemini"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        setApiKey(data.apiKey || '');
        setPrompt(data.instructions || '');
        setSelectedModel(data.model || 'gemini-1.5-flash');
        setEnabledPlatforms(data.platforms || {
          whatsapp: false,
          telegram: false,
          'telegram-api': false,
          facebook: false,
          instagram: false
        });
        if (data.apiMeta) setApiMeta(data.apiMeta);
      } else {
        setConfig(null);
      }
    });
    return () => unsub();
  }, [currentUserId]);

  const handleSave = async () => {
    if (!apiKey) return toast.error("Bhai, API Key toh dalo!");
    setLoading(true);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();

      if (data.error) {
        setLoading(false);
        return toast.error(`Google Reject: ${data.error.message}`);
      }

      const models = data.models.map(m => m.displayName);
      const hasPro = models.some(m => m.includes("1.5 Pro"));
      const version = "v1beta / Gemini 1.5 Series";

      const metadata = {
        verifiedModels: models.slice(0, 5),
        tier: hasPro ? "Premium / Pro Access" : "Standard / Flash Only",
        apiVersion: version,
        lastVerified: new Date().toLocaleString()
      };

      setApiMeta(metadata);

      await setDoc(doc(db, "configs", currentUserId, "ai", "gemini"), {
        apiKey,
        instructions: prompt,
        platforms: enabledPlatforms,
        model: selectedModel,
        status: 'active',
        apiMeta: metadata,
        updatedAt: new Date()
      });

      toast.success("Neural Link Established & Verified! ✅");
    } catch (err) {
      toast.error("Network Error: Verification failed.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Kya aap AI connection delete karna chahte hain?")) {
      await deleteDoc(doc(db, "configs", currentUserId, "ai", "gemini"));
      setApiKey('');
      setApiMeta(null);
      toast.info("AI settings removed.");
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto bg-[#080808] min-h-screen text-white transition-all duration-500">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-blue-500 animate-pulse" size={24} />
              <h2 className="text-4xl font-black tracking-tighter italic uppercase">AI <span className="text-blue-500">Neural Link</span></h2>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Configure your Gemini brain for multi-platform automation.</p>
        </div>

        {apiMeta && (
            <div className="bg-zinc-900/80 border border-white/5 p-4 rounded-3xl flex items-center gap-4 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Connection Status</p>
                    <p className="text-xs font-bold text-white">{apiMeta.tier}</p>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">Neural API Key</label>
                        <input 
                            type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste Gemini API Key..."
                            className="w-full bg-black/50 border border-white/5 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-mono tracking-widest"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">Preferred Model</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['gemini-1.5-flash', 'gemini-1.5-pro', 'auto'].map(m => (
                                    <button 
                                        key={m} onClick={() => setSelectedModel(m)}
                                        className={`p-4 rounded-2xl border-2 text-[9px] font-black uppercase transition-all ${selectedModel === m ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/5 bg-black/40 text-zinc-600'}`}
                                    >
                                        {m.split('-').pop()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-4">Neural Context</label>
                            <textarea 
                                rows="3" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl outline-none focus:border-blue-500 text-xs leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-6">Auto-Reply Triggers</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16}/> },
                            { id: 'telegram', label: 'Bot API', icon: <Bot size={16}/> },
                            { id: 'telegram-api', label: 'Client API', icon: <Globe size={16}/> },
                            // New Facebook and Instagram Triggers
                            { id: 'facebook', label: 'Messenger', icon: <Facebook size={16}/> },
                            { id: 'instagram', label: 'Instagram', icon: <Instagram size={16}/> }
                        ].map(p => (
                            <div 
                                key={p.id} onClick={() => setEnabledPlatforms({...enabledPlatforms, [p.id]: !enabledPlatforms[p.id]})}
                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${enabledPlatforms[p.id] ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5' : 'bg-black/40 border-white/5 opacity-40 hover:opacity-100'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabledPlatforms[p.id] ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{p.icon}</div>
                                    <span className="text-[11px] font-bold">{p.label}</span>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${enabledPlatforms[p.id] ? 'bg-blue-500 border-blue-500' : 'border-zinc-700'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                        {config ? 'Update Brain' : 'Connect Brain'}
                    </button>
                    {config && (
                        <button onClick={handleDelete} className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] h-full">
                <div className="flex items-center gap-3 mb-6">
                    <Info className="text-blue-500" size={20} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">Neural Diagnostics</h3>
                </div>
                
                {apiMeta ? (
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Engine Version</p>
                            <p className="text-xs font-mono text-zinc-300">{apiMeta.apiVersion}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Supported Models</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {apiMeta.verifiedModels.map(m => (
                                    <span key={m} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] text-zinc-400">{m}</span>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/5">
                             <p className="text-[9px] text-zinc-600 italic">Last Sync: {apiMeta.lastVerified}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                        <ShieldAlert size={32} className="mb-4" />
                        <p className="text-[10px] font-bold uppercase leading-relaxed">No active link detected.<br/>Please verify your API key.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntegration;
    
