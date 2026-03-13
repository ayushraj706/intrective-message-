import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Globe, Shield, Smartphone, Key, ExternalLink } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [copiedField, setCopiedField] = useState(''); // 'url' or 'token'
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    inboxName: '',
    phoneId: '',
    businessId: '',
    accessToken: ''
  });
  
  const userId = auth.currentUser?.uid;
  const webhookUrl = `https://intrective-message.vercel.app/api/webhook/${userId}`;
  const [verifyToken, setVerifyToken] = useState('');

  const generateToken = () => `bk_${Math.random().toString(36).substring(2, 15)}`;

  const handleConnect = async () => {
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      alert("Bhai, saare credentials bhariye tabhi toh connect hoga!");
      return;
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
      
      const unsub = onSnapshot(doc(db, "configs", userId), (doc) => {
        if (doc.data()?.isVerified) setIsVerified(true);
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="p-12 bg-zinc-50 dark:bg-[#111111] h-screen overflow-y-auto transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-10 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={16} /> Back
        </button>
        
        <h2 className="text-4xl font-extrabold mb-12 text-zinc-900 dark:text-white tracking-tighter">WhatsApp Business Setup</h2>
        
        <div className="bg-white dark:bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 space-y-6 shadow-2xl">
          {/* Inbox Name */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Display Name (Inbox Name)</label>
            <input type="text" placeholder="e.g. BaseKey Official" className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none transition-all" onChange={(e) => setFormData({...formData, inboxName: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Phone Number ID</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-5 top-4.5 text-zinc-500" />
                <input type="text" placeholder="1059..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">WABA Account ID</label>
              <input type="text" placeholder="2948..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Permanent Access Token</label>
            <div className="relative">
                <Key size={18} className="absolute left-5 top-5 text-zinc-500" />
                <textarea rows="4" placeholder="EAAG..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none resize-none" onChange={(e) => setFormData({...formData, accessToken: e.target.value})} />
            </div>
          </div>

          <button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Processing...' : 'Generate Webhook & Connect'}
          </button>
        </div>
      </div>

      {/* --- POPUP MODAL (The Fix is Here) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-[#1a1c1e] w-full max-w-lg rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 p-10 shadow-3xl relative">
            
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Shield className="text-blue-500" size={24} /> Verify Webhook
            </h3>
            <p className="text-zinc-500 text-sm mb-8">Meta Developer Portal पर ये क्रेडेंशियल्स डालें।</p>
            
            <div className="space-y-6">
              {/* Webhook URL Field */}
              <div className="p-5 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-gray-800 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Callback URL</label>
                  <button onClick={() => copyToClipboard(webhookUrl, 'url')} className="text-blue-500 hover:bg-blue-500/10 p-1 rounded-md transition-all">
                    {copiedField === 'url' ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <code className="text-[11px] font-mono text-zinc-600 dark:text-gray-400 break-all leading-relaxed select-all">{webhookUrl}</code>
              </div>

              {/* Verify Token Field */}
              <div className="p-5 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-gray-800 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verify Token</label>
                  <button onClick={() => copyToClipboard(verifyToken, 'token')} className="text-blue-500 hover:bg-blue-500/10 p-1 rounded-md transition-all">
                    {copiedField === 'token' ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <code className="text-sm font-mono text-zinc-600 dark:text-gray-400 select-all">{verifyToken}</code>
              </div>
            </div>

            {/* Verification Status */}
            <div className="mt-8">
              {isVerified ? (
                <div className="flex items-center justify-center gap-3 text-green-500 font-bold bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-sm">
                  <CheckCircle2 size={18} /> Meta Verified Successfully!
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl animate-pulse text-sm">
                  <Loader2 className="animate-spin" size={16} /> Meta Verification का इंतज़ार है...
                </div>
              )}
            </div>
            
            {errorMessage && <p className="mt-4 text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{errorMessage}</p>}
            
            <button 
              onClick={() => isVerified ? onBack() : setErrorMessage("Pehle Meta Portal par verify karo bhai!")} 
              className={`w-full mt-6 py-5 rounded-2xl font-bold transition-all shadow-lg ${isVerified ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            >
              {isVerified ? 'Finish Setup' : 'Waiting for Meta...'}
            </button>

            <a href="https://developers.facebook.com/" target="_blank" className="flex items-center justify-center gap-1 mt-6 text-xs text-blue-500 hover:underline">
              Open Meta Portal <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
