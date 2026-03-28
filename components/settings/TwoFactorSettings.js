import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Key, Hash, Smartphone, Save, Zap } from 'lucide-react';

export default function TwoFactorSettings({ onBack }) {
  // State for Form Fields
  const [formData, setFormData] = useState({
    apiId: '',
    apiHash: '',
    session: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in slide-in-from-right duration-500">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">System Nodes</span>
      </button>

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-2">
          <ShieldCheck className="text-blue-500" size={32} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            2FA <span className="text-blue-500">Configuration</span>
          </h2>
        </div>
        <p className="text-zinc-500 mb-12 text-sm font-medium font-mono tracking-widest uppercase opacity-70">
          Telegram Neural Link for Identity Verification
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="space-y-6">
                
                {/* API ID & Hash Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] ml-2">
                      <Hash size={12} /> Telegram API ID
                    </label>
                    <input 
                      name="apiId"
                      type="text" 
                      placeholder="1234567"
                      value={formData.apiId}
                      onChange={handleChange}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] ml-2">
                      <Key size={12} /> API Hash
                    </label>
                    <input 
                      name="apiHash"
                      type="password" 
                      placeholder="abcdef123456..."
                      value={formData.apiHash}
                      onChange={handleChange}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Session String */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] ml-2">
                    <Zap size={12} /> String Session
                  </label>
                  <textarea 
                    name="session"
                    rows="3"
                    placeholder="Enter your Telegram String Session..."
                    value={formData.session}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono text-xs resize-none"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] ml-2">
                    <Smartphone size={12} /> Linked Phone Number
                  </label>
                  <input 
                    name="phoneNumber"
                    type="text" 
                    placeholder="+91 00000 00000"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  />
                </div>

                {/* Save Button */}
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/10 uppercase tracking-tighter"
                >
                  Deploy Node Settings <Save size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Info Side Panel */}
          <div className="space-y-6">
            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem]">
              <h4 className="text-blue-500 font-bold mb-3 flex items-center gap-2">
                <Zap size={16} /> How it works
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Ye settings aapke Telegram account ko ek OTP gateway mein badal dengi. 
                <br /><br />
                Jab bhi koi is account se login karega, isi API configuration ka use karke OTP bheja jayega.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem]">
              <h4 className="text-zinc-300 font-bold mb-3 text-sm">Security Note</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-relaxed">
                Aapka API Hash aur Session encrypted format mein Firebase mein save hoga. Ise kisi ke saath share na karein.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                        }
                  
