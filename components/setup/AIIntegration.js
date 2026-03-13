import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Brain, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AIIntegration = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [aiType, setAiType] = useState('none'); // none, gemini, chatgpt
  const [config, setConfig] = useState({
    apiKey: '',
    systemPrompt: 'You are a helpful assistant for BaseKey Business.',
    modelName: ''
  });

  // पुराने सेव किए हुए AI क्रेडेंशियल्स लोड करना
  useEffect(() => {
    const loadAIConfig = async () => {
      const docSnap = await getDoc(doc(db, "configs", "ai_setup"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAiType(data.aiType);
        setConfig(data.config);
      }
    };
    loadAIConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "configs", "ai_setup"), {
        aiType,
        config,
        updatedAt: new Date()
      });
      alert("AI Settings saved! Ab aapka bot aapke hisab se kaam karega.");
    } catch (error) {
      alert("Error saving config: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#111111] h-screen overflow-y-auto transition-all">
      <div className="max-w-4xl">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-10 font-bold uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h2 className="text-4xl font-extrabold mb-4 text-zinc-900 dark:text-white tracking-tighter">AI Integration</h2>
        <p className="text-zinc-500 mb-12 text-lg">Apna pasandida AI connect karein ya sirf manual chat use karein.</p>

        {/* AI Provider Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <SelectionCard 
            title="Manual Only" 
            desc="No AI, sirf main khud chat karunga." 
            icon={<ShieldCheck size={24}/>} 
            active={aiType === 'none'} 
            onClick={() => setAiType('none')} 
          />
          <SelectionCard 
            title="Google Gemini" 
            desc="Use Gemini Pro API for smart replies." 
            icon={<Sparkles size={24} className="text-blue-500"/>} 
            active={aiType === 'gemini'} 
            onClick={() => setAiType('gemini')} 
          />
          <SelectionCard 
            title="OpenAI ChatGPT" 
            desc="Use GPT-4 for advanced automation." 
            icon={<Brain size={24} className="text-green-500"/>} 
            active={aiType === 'chatgpt'} 
            onClick={() => setAiType('chatgpt')} 
          />
        </div>

        {/* Configuration Form */}
        {aiType !== 'none' && (
          <div className="bg-white dark:bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 space-y-8 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Your API Key</label>
              <input 
                type="password" 
                value={config.apiKey}
                placeholder={aiType === 'gemini' ? "Paste Gemini API Key here" : "Paste OpenAI API Key here"}
                className="w-full bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">System Instructions (Prompt)</label>
              <textarea 
                value={config.systemPrompt}
                rows="4"
                placeholder="AI ko samjhayein ki use kaise baat karni hai..."
                className="w-full bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none resize-none"
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {loading ? 'Saving Setup...' : `Connect ${aiType.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SelectionCard = ({ title, desc, icon, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-3xl border cursor-pointer transition-all ${active ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 shadow-lg' : 'bg-white dark:bg-[#1a1c1e] border-zinc-200 dark:border-gray-800 hover:border-zinc-400 dark:hover:border-gray-600'}`}
  >
    <div className="mb-4">{icon}</div>
    <h3 className={`font-bold ${active ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>{title}</h3>
    <p className="text-xs text-zinc-500 mt-1">{desc}</p>
  </div>
);

export default AIIntegration;
                    
