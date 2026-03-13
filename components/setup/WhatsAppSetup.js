import React, { useState } from 'react';
import { ArrowLeft, Save, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../../firebase'; // Firebase config
import { doc, setDoc } from 'firebase/firestore'; 

const WhatsAppSetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    inboxName: '',
    phoneId: '',
    accessToken: ''
  });

  // डेटा को Firestore में सेव करने का फंक्शन
  const handleSave = async () => {
    if (!formData.inboxName || !formData.phoneId || !formData.accessToken) {
      alert("Bhai, saare dabbe bharo pehle!");
      return;
    }

    setLoading(true);
    try {
      // 'configs' collection में 'whatsapp' नाम के document में सेव करना
      await setDoc(doc(db, "configs", "whatsapp"), {
        ...formData,
        updatedAt: new Date()
      });
      alert("Mubarak ho! WhatsApp connect ho gaya. 🚀");
      onBack(); // वापस इनबॉक्स पेज पर भेजें
    } catch (error) {
      console.error("Error saving:", error);
      alert("Oops! Kuch gadbad ho gayi.");
    }
    setLoading(false);
  };

  return (
    <div className="p-12 bg-[#111111] h-screen overflow-y-auto">
      <div className="max-w-3xl">
        <button onClick={onBack} className="text-gray-500 hover:text-white mb-10 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        
        <h2 className="text-4xl font-extrabold mb-12 text-white tracking-tighter">WhatsApp Business Setup</h2>
        
        <div className="bg-[#1a1c1e] p-10 rounded-[2.5rem] border border-gray-800 space-y-8 shadow-2xl">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Inbox Name</label>
            <input 
              type="text" 
              placeholder="e.g. BaseKey Support"
              className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all"
              onChange={(e) => setFormData({...formData, inboxName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Phone Number ID</label>
              <input 
                type="text" 
                placeholder="105928..."
                className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, phoneId: e.target.value})}
              />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Verification Status</label>
                <div className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-gray-500 italic">Ready to Sync</div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Permanent Access Token</label>
            <textarea 
              placeholder="EAAG..." 
              rows="4"
              className="w-full bg-[#111] border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none resize-none"
              onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Saving to Cloud...' : 'Finish & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetup;

