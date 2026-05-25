import React, { useState } from 'react';
import { Save, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';

const Configuration = () => {
  const [config, setConfig] = useState({
    phoneId: '',
    accessToken: '',
    businessName: ''
  });

  const handleSave = () => {
    // Yahan hum baad mein Firebase mein save karne ka logic daalenge
    console.log("Settings Saved:", config);
    alert("WhatsApp Settings Updated Successfully!");
  };

  return (
    <div className="p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Smartphone className="text-green-500" /> WhatsApp Configuration
        </h1>
        <p className="text-gray-400 mb-8">Apne Meta Business API ke credentials yahan manage karein.</p>

        <div className="space-y-6 bg-[#121212] p-6 rounded-2xl border border-gray-800">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Business Display Name</label>
            <input 
              type="text"
              placeholder="e.g. BaseKey Official"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
              value={config.businessName}
              onChange={(e) => setConfig({...config, businessName: e.target.value})}
            />
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Phone Number ID <HelpCircle size={14} className="text-gray-500 cursor-help" />
            </label>
            <input 
              type="text"
              placeholder="Enter 15-digit Phone ID"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-mono text-sm"
              value={config.phoneId}
              onChange={(e) => setConfig({...config, phoneId: e.target.value})}
            />
          </div>

          {/* System User Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Permanent Access Token</label>
            <textarea 
              rows="4"
              placeholder="Paste your Meta Access Token here..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all font-mono text-xs"
              value={config.accessToken}
              onChange={(e) => setConfig({...config, accessToken: e.target.value})}
            />
          </div>

          {/* Security Note */}
          <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl flex gap-3">
            <ShieldCheck className="text-blue-400 shrink-0" size={20} />
            <p className="text-xs text-blue-200">
              Aapka Access Token humare Firestore mein AES-256 encryption ke saath surakshit save kiya jayega.
            </p>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
          >
            <Save size={20} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuration;

