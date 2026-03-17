import React, { useState, useEffect } from 'react';
import { Instagram, Zap, Copy, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function InstagramSetup({ userId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    token: '',
    webhook: `https://intrective-message-vercel.app/api/instagram-webhook/${userId}`,
    status: 'idle'
  });

  useEffect(() => {
    if(!userId) return;
    const loadConfig = async () => {
      const snap = await getDoc(doc(db, 'configs', userId));
      if (snap.exists() && snap.data().insta_verify_token) {
        setConfig(prev => ({ ...prev, token: snap.data().insta_verify_token, status: 'active' }));
      }
    };
    loadConfig();
  }, [userId]);

  const generateNode = async () => {
    setLoading(true);
    const newToken = 'BK_INSTA_' + Math.random().toString(36).substring(7).toUpperCase();
    try {
      await setDoc(doc(db, 'configs', userId), {
        insta_verify_token: newToken,
        setup_type: 'instagram'
      }, { merge: true });
      setConfig(prev => ({ ...prev, token: newToken, status: 'active' }));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-12 bg-[#080808] min-h-screen text-white">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Inboxes
      </button>

      <div className="max-w-2xl bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-pink-500/20 transition-all duration-700">
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

        <div className="space-y-4">
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
              <p className="text-xs text-green-400 font-mono italic">{config.token || 'Not Generated'}</p>
            </div>
            {config.token && <button onClick={() => navigator.clipboard.writeText(config.token)} className="p-2 text-zinc-600 hover:text-white transition-all"><Copy size={18} /></button>}
          </div>
        </div>

        <button onClick={generateNode} disabled={loading} className="mt-8 w-full py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3">
          {loading ? <RefreshCw className="animate-spin" /> : <Zap size={18} />} Activate Insta Node
        </button>
      </div>
    </div>
  );
}
