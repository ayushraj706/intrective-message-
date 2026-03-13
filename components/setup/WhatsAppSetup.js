import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Globe, Shield } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ inboxName: '', phoneId: '', accessToken: '' });
  
  const userId = auth.currentUser?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/webhook/${userId}`;
  const [verifyToken, setVerifyToken] = useState('');

  // रैंडम टोकन जेनरेटर
  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  const handleConnect = async () => {
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      alert("Bhai, saare dabbe bharo pehle!"); return;
    }

    setLoading(true);
    const newToken = generateToken();
    setVerifyToken(newToken);

    try {
      await setDoc(doc(db, "configs", userId), {
        ...formData,
        webhookVerifyToken: newToken,
        isVerified: false,
        updatedAt: new Date()
      });
      setShowModal(true);
      
      // रियल-टाइम लिसनर: जैसे ही Meta वेरीफाई करेगा, हमें पता चल जाएगा
      const unsub = onSnapshot(doc(db, "configs", userId), (doc) => {
        if (doc.data()?.isVerified) setIsVerified(true);
      });
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleDone = () => {
    if (isVerified) {
      alert("Mubarak ho! Connection success.");
      onBack();
    } else {
      setErrorMessage("Bhai, pehle Meta portal pe verify toh karo! Error: Webhook not connected.");
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#111111] h-screen overflow-y-auto relative">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-10 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={16} /> Back
        </button>
        
        <h2 className="text-4xl font-extrabold mb-12 text-zinc-900 dark:text-white tracking-tighter">WhatsApp Business Setup</h2>
        
        <div className="bg-white dark:bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 space-y-8 shadow-2xl transition-colors">
          {/* Inputs */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-4">Inbox Name</label>
            <input type="text" placeholder="e.g. BaseKey Support" className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none transition-all" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>
          {/* ... बाक़ी inputs (PhoneID, Token) वैसे ही रहेंगे ... */}

          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Generating Webhook...' : 'Connect to Meta'}
          </button>
        </div>
      </div>

      {/* --- POPUP MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#1a1c1e] w-full max-w-lg rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 p-10 shadow-3xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Shield className="text-blue-500" /> Webhook Setup
            </h3>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Meta Developer Portal पर ये क्रेडेंशियल्स डालें और 'Verify' बटन दबाएँ।</p>

            <div className="space-y-6">
              <div className="p-5 bg-zinc-50 dark:bg-[#111] border border-zinc-100 dark:border-gray-800 rounded-2xl">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 tracking-widest">Callback URL</label>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono text-zinc-500 truncate">{webhookUrl}</span>
                  <button onClick={() => copyToClipboard(webhookUrl)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-all"><Copy size={16} /></button>
                </div>
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-[#111] border border-zinc-100 dark:border-gray-800 rounded-2xl">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 tracking-widest">Verify Token</label>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono text-zinc-500">{verifyToken}</span>
                  <button onClick={() => copyToClipboard(verifyToken)} className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-all"><Copy size={16} /></button>
                </div>
              </div>
            </div>

            {errorMessage && <p className="mt-6 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl animate-bounce">{errorMessage}</p>}
            
            {isVerified && <p className="mt-6 text-green-500 text-xs font-bold bg-green-500/10 p-3 rounded-xl flex items-center gap-2"><CheckCircle2 size={16}/> Webhook Verified by Meta!</p>}

            <button onClick={handleDone} className={`w-full mt-8 py-5 rounded-2xl font-bold transition-all ${isVerified ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
              Done & Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
