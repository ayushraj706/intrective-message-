import React, { useState, useEffect } from 'react';
import { Facebook, Zap, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { db } from '../../firebase'; // Aapka firebase path
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function FacebookSetup({ userId }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    token: '',
    webhook: `https://ayus.fun/api/messenger-webhook/${userId}`,
    status: 'idle'
  });

  useEffect(() => {
    const loadConfig = async () => {
      const snap = await getDoc(doc(db, 'configs', userId));
      if (snap.exists() && snap.data().meta_verify_token) {
        setConfig(prev => ({ ...prev, token: snap.data().meta_verify_token, status: 'active' }));
      }
    };
    loadConfig();
  }, [userId]);

  const generateNode = async () => {
    setLoading(true);
    const newToken = 'BK_META_' + Math.random().toString(36).substring(7).toUpperCase();
    try {
      await setDoc(doc(db, 'configs', userId), {
        meta_verify_token: newToken,
        setup_type: 'messenger'
      }, { merge: true });
      setConfig(prev => ({ ...prev, token: newToken, status: 'ready' }));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-5 bg-zinc-900/30 border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500">
            <Facebook size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Messenger <span className="text-blue-500">Node</span></h3>
            <p className="text-[10px] text-zinc-500 font-mono">Automation Level: Enterprise</p>
          </div>
        </div>
        {config.status === 'active' && <CheckCircle2 className="text-green-500" size={18} />}
      </div>

      <div className="space-y-3">
        {/* Callback URL - Auto Generated */}
        <div className="p-3 bg-black/50 border border-zinc-800 rounded-xl flex justify-between items-center group">
          <div className="overflow-hidden">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Webhook URL</p>
            <p className="text-[10px] text-blue-400 font-mono truncate">{config.webhook}</p>
          </div>
          <button onClick={() => navigator.clipboard.writeText(config.webhook)} className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white transition-all">
            <Copy size={14} />
          </button>
        </div>

        {/* Verify Token - Database Driven */}
        <div className="p-3 bg-black/50 border border-zinc-800 rounded-xl flex justify-between items-center group">
          <div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Verify Token</p>
            <p className="text-[10px] text-green-400 font-mono italic">{config.token || 'Click Generate...'}</p>
          </div>
          {config.token && (
            <button onClick={() => navigator.clipboard.writeText(config.token)} className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white transition-all">
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>

      <button 
        onClick={generateNode}
        disabled={loading}
        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
      >
        {loading ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
        {config.token ? 'Regenerate Neural Key' : 'Deploy Meta Webhook'}
      </button>
    </div>
  );
}

