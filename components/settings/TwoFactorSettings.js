import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Smartphone, Lock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function TwoFactorSettings({ onBack }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in slide-in-from-right duration-500">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
      </button>

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-2">
          <ShieldCheck className="text-blue-500" size={32} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-blue-500">2FA Security</span>
          </h2>
        </div>
        <p className="text-zinc-500 mb-12 text-sm font-medium font-mono tracking-widest uppercase opacity-70">
          Protect your Gmail identity with Phone Verification
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Status & Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 2FA Status Card */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${is2FAEnabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#111] border-white/5'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                    {is2FAEnabled ? 'Your account is highly secured' : 'Your account is at risk'}
                  </p>
                </div>
                {/* Toggle Switch */}
                <button 
                  onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Conditional Content based on Toggle */}
              {is2FAEnabled ? (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.2em] ml-2">
                      <Smartphone size={12} /> Linked Phone Number
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="+91 00000 00000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                      />
                      {isVerified && <CheckCircle2 className="absolute right-4 top-4 text-green-500" size={20} />}
                    </div>
                  </div>

                  <button className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-tighter hover:bg-zinc-200 transition-all">
                    Update Security Phone
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <ShieldAlert className="text-red-500 shrink-0" size={20} />
                  <p className="text-[11px] text-red-200/60 leading-relaxed">
                    2FA is currently disabled. We recommend enabling it to prevent unauthorized access to your Gmail data and Neural nodes.
                  </p>
                </div>
              )}
            </div>

            {/* Backup Codes Section */}
            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-zinc-900 rounded-2xl">
                  <Lock className="text-zinc-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Backup Recovery</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">In case you lose access to Telegram</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest underline underline-offset-8">
                Generate Backup Codes
              </button>
            </div>
          </div>

          {/* Right Side: Tips & Info */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-tighter">
                <CheckCircle2 size={16} className="text-blue-500" /> Security Tip
              </h4>
              <ul className="space-y-4">
                <li className="text-[11px] text-zinc-400 leading-relaxed">
                  <b className="text-zinc-200">Identity Linking:</b> Linking your phone allows you to recover your account if you lose your Gmail password.
                </li>
                <li className="text-[11px] text-zinc-400 leading-relaxed">
                  <b className="text-zinc-200">Neural Gateway:</b> OTPs will be delivered via your pre-configured Telegram API Node.
                </li>
              </ul>
            </div>
            
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10">
               <AlertCircle className="text-blue-500 mb-3" size={24} />
               <p className="text-[10px] text-blue-200/50 uppercase tracking-[0.1em] font-bold">
                 Always keep your primary device active to receive real-time alerts.
               </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
  }
                
