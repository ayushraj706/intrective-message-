import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2, X, Globe, Shield, Smartphone, Key } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
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
      // डेटाबेस में यूजर की कॉन्फ़िगरेशन सेव करना
      await setDoc(doc(db, "configs", userId), {
        ...formData,
        webhookVerifyToken: newToken,
        isVerified: false,
        updatedAt: new Date()
      });
      
      setShowModal(true);
      
      // Real-time listener: Meta से वेरिफिकेशन चेक करने के लिए
      onSnapshot(doc(db, "configs", userId), (doc) => {
        if (doc.data()?.isVerified) setIsVerified(true);
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
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
            {/* Phone Number ID */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">Phone Number ID</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-5 top-4.5 text-zinc-500" />
                <input type="text" placeholder="1059..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl pl-14 pr-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, phoneId: e.target.value})} />
              </div>
            </div>

            {/* Business Account ID */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3 px-1">WABA Account ID</label>
              <input type="text" placeholder="2948..." className="w-full bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white focus:border-blue-500 outline-none" onChange={(e) => setFormData({...formData, businessId: e.target.value})} />
            </div>
          </div>

          {/* Access Token */}
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

      {/* --- POPUP MODAL (Same as before but with error handling) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1a1c1e] w-full max-w-lg rounded-[2.5rem] border border-zinc-200 dark:border-gray-800 p-10 shadow-3xl relative">
            {/* Modal Content here (as in previous code) */}
            <h3 className="text-2xl font-bold mb-6">Verify Webhook</h3>
            {/* ... Modal inputs for Webhook URL and Token ... */}
            
            {errorMessage && <p className="text-red-500 text-xs font-bold mb-4 bg-red-500/10 p-3 rounded-xl">{errorMessage}</p>}
            
            <button onClick={() => isVerified ? onBack() : setErrorMessage("Meta Portal par verification abhi baaki hai bhai!")} 
              className={`w-full py-5 rounded-2xl font-bold transition-all ${isVerified ? 'bg-green-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
              {isVerified ? 'Done' : 'Waiting for Verification...'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSetup;
