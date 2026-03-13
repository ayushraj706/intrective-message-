import React, { useState } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2 } from 'lucide-react';

const WhatsAppSetup = ({ onBack }) => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = "https://intrective-message.vercel.app/api/whatsapp";
  const verifyToken = "basekey_secure_v1"; // Ye hum generate kar sakte hain

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-12 bg-[#111111] h-screen overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-10 transition-colors font-bold uppercase text-[10px] tracking-[0.2em]">
          <ArrowLeft size={16} /> Back to Inboxes
        </button>
        
        <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tighter">WhatsApp Business Setup</h2>
        <p className="text-gray-500 mb-12 text-lg">Meta Developer Portal पर जाकर इन क्रेडेंशियल्स को कॉन्फ़िगर करें।</p>
        
        <div className="space-y-8">
          {/* Step 1: Webhook Info */}
          <div className="bg-[#1a1c1e] p-8 rounded-[2rem] border border-gray-800 shadow-xl">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-6">Step 1: Webhook Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">Callback URL</label>
                <div className="flex gap-2">
                    <input readOnly value={webhookUrl} className="flex-1 bg-[#111] border border-gray-800 rounded-xl px-5 py-4 text-gray-400 font-mono text-sm" />
                    <button onClick={() => copyToClipboard(webhookUrl)} className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all">
                        {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">Verify Token</label>
                <input readOnly value={verifyToken} className="w-full bg-[#111] border border-gray-800 rounded-xl px-5 py-4 text-gray-400 font-mono text-sm" />
              </div>
            </div>
          </div>

          {/* Step 2: Credentials Input */}
          <div className="bg-[#1a1c1e] p-8 rounded-[2rem] border border-gray-800 shadow-xl">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-6">Step 2: Enter Credentials</h3>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">Phone Number ID</label>
                        <input type="text" placeholder="e.g. 105928374..." className="w-full bg-[#111] border border-gray-800 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">Inbox Name</label>
                        <input type="text" placeholder="e.g. Customer Support" className="w-full bg-[#111] border border-gray-800 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">Permanent Access Token</label>
                    <textarea placeholder="EAAG..." rows="4" className="w-full bg-[#111] border border-gray-800 rounded-xl px-5 py-4 text-white focus:border-blue-500 outline-none resize-none" />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 transition-all">
                    <Save size={20} /> Finish & Connect
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetup;
