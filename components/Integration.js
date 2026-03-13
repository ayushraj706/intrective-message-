import React, { useState } from 'react';
import { Sparkles, BrainCircuit, MessageSquareCode, Save, Info } from 'lucide-react';

const Integration = () => {
  const [aiConfig, setAiConfig] = useState({
    apiKey: '',
    model: 'gemini-1.5-flash',
    systemPrompt: 'You are a professional assistant for BaseKey...'
  });

  return (
    <div className="p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="text-purple-500" /> AI Integration
        </h1>
        <p className="text-gray-400 mb-8">BaseKey ke AI brain (Gemini) ko configure aur train karein.</p>

        <div className="grid gap-6">
          {/* Gemini API Card */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-900/30 p-2 rounded-lg">
                <BrainCircuit className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gemini API Settings</h3>
                <p className="text-xs text-gray-500">Google AI Studio se apni key yahan daalein.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Google Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:border-purple-500 outline-none font-mono text-sm"
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* AI Persona Card */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-900/30 p-2 rounded-lg">
                <MessageSquareCode className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Personality (System Prompt)</h3>
                <p className="text-xs text-gray-500">Bot kaise baat karega? Ise yahan likhein.</p>
              </div>
            </div>

            <textarea 
              rows="6"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none text-sm leading-relaxed text-gray-300"
              value={aiConfig.systemPrompt}
              onChange={(e) => setAiConfig({...aiConfig, systemPrompt: e.target.value})}
              placeholder="Example: You are a helpful sales assistant for SuperKey..."
            />
            
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-900/50 p-3 rounded-lg">
              <Info size={16} className="shrink-0" />
              <p>Ek accha system prompt bot ko 'Hallucination' (galat jawab dene) se rokta hai.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20">
              <Save size={20} /> Update AI Brain
            </button>
            <button className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all">
              Test Bot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integration;
            
