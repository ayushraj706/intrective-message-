import React, { useState, useEffect } from 'react';
import { Instagram, Zap, Copy, RefreshCw, CheckCircle2, ArrowLeft, Key, ShieldCheck, Fingerprint } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function InstagramSetup({ userId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    token: '',
    page_access_token: '',
    app_secret: '',
    app_id: '',
    webhook: `https://intrective-message-vercel.app/api/instagram-webhook/${userId}`,
    status: 'idle'
  });

  // 1. Firebase se data load karna
  useEffect(() => {
    if(!userId) return;
    const loadConfig = async () => {
      const snap = await getDoc(doc(db, 'configs', userId));
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({ 
          ...prev, 
          token: data.insta_verify_token || '', 
          page_access_token: data.page_access_token || '',
          app_secret: data.app_secret || '',
          app_id: data.app_id || '',
          status: data.insta_verify_token ? 'active' : 'idle' 
        }));
      }
    };
    loadConfig();
  }, [userId]);

  // 2. Sab kuch Firebase mein save karna
  const activateNode = async () => {
    if(!config.page_access_token || !config.app_secret) {
        alert("Bhai, Access Token aur App Secret toh daal do!");
        return;
    }
    
    setLoading(true);
    const newToken = config.token || 'BK_INSTA_' + Math.random().toString(36).substring(7).toUpperCase();
    
    try {
      await setDoc(doc(db, 'configs', userId), {
        insta_verify_token: newToken,
        page_access_token: config.page_access_token,
        app_secret: config.app_secret,
        app_id: config.app_id,
        setup_type: 'instagram',
        updatedAt: new Date()
      }, { merge: true });
      
      setConfig(prev => ({ ...prev, token: newToken, status: 'active' }));
      alert("Insta Node Activated! Ab Webhook verify kar lo.");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-12 bg-[#080808] min-h-screen text-white">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Inboxes
      </button>

      <div className="max-w-2xl bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-pink-500/20 transition-all duration-700">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-pink-600/10 rounded-2xl text-pink-500">
              <Instagram size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Instagram <span className="text-pink-500">Node</span></h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Meta API V.18.0</p>
            </div>
          </div>
          {config.status === 'active' && <CheckCircle2 className="text-green-500" size={24} />}
        </div>

        {/* Input Fields for Meta Credentials */}
        <div className="space-y-4 mb-8">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Meta Credentials</p>
          
          {/* Page Access Token */}
          <div className="p-4 bg-black/50 border border-white/5 rounded-2xl flex flex-col gap-2">
            <label className="text-[9px] text-zinc-500 uppercase font-black flex items-center gap-2"><Key size={12}/> Page Access Token</label>
            <input 
              value={config.page_access_token}
              onChange={(e) => setConfig({...config, page_access_token: e.target.value})}
              placeholder="EAA..."
              className="bg-transparent border-none text-xs text-pink-400 font-mono focus:ring-0 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* App Secret */}
            <div className="p-4 bg-black/50 border border-white/5 rounded-2xl flex flex-col gap-2">
                <label className="text-[9px] text-zinc-500 uppercase font-black flex items-center gap-2"><ShieldCheck size={12}/> App Secret</label>
                <input 
                type="password"
                value={config.app_secret}
                onChange={(e) => setConfig({...config, app_secret: e.target.value})}
                placeholder="••••••••"
                className="bg-transparent border-none text-xs text-zinc-400 font-mono focus:ring-0 w-full"
                />
            </div>
            {/* App ID */}
            <div className="p-4 bg-black/50 border border-white/5 rounded-2xl flex flex-col gap-2">
                <label className="text-[9px] text-zinc-500 uppercase font-black flex items-center gap-2"><Fingerprint size={12}/> App ID</label>
                <input 
                value={config.app_id}
                onChange={(e) => setConfig({...config, app_id: e.target.value})}
                placeholder="123456..."
                className="bg-transparent border-none text-xs text-zinc-400 font-mono focus:ring-0 w-full"
                />
            </div>
          </div>
        </div>

        {/* Webhook & Verify Token Section */}
        <div className="space-y-4 border-t border-white/5 pt-8">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-2">Webhook Configuration</p>
          
          <div className="p-5 bg-black/50 border border-white/5 rounded-2xl flex justify-between items-center group">
            <div className="overflow-hidden">
              <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Webhook URL</p>
              <p className="text-xs text-pink-400 font-mono truncate">{config.webhook}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(config.webhook)} className="p-2 text-zinc-600 hover:text-white transition-all"><Copy size={18} /></button>
          </div>

          <div className="p-5 bg-black/50 border border-white/5 rounded-2xl flex justify-between items-center group">
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Verify Token</p>
              <p className="text-xs text-green-400 font-mono italic">{config.token || 'Will generate on activation'}</p>
            </div>
            {config.token && <button onClick={() => navigator.clipboard.writeText(config.token)} className="p-2 text-zinc-600 hover:text-white transition-all"><Copy size={18} /></button>}
          </div>
        </div>

        <button 
          onClick={activateNode} 
          disabled={loading} 
          className="mt-8 w-full py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_-10px_rgba(219,39,119,0.5)]"
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Zap size={18} />} 
          {config.status === 'active' ? 'Update Insta Node' : 'Activate Insta Node'}
        </button>
      </div>
    </div>
  );
                  }
