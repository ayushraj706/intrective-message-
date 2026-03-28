import React, { useState, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Smartphone, Lock, CheckCircle2, AlertCircle, ShieldAlert, Loader2, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSettings({ onBack, userEmail }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Number, 2: OTP
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const otpRefs = useRef([]);

  // OTP Input Logic
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  // Signal: Master Node se OTP bhejna
  const requestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return toast.error("Valid phone number daalein!");
    
    setLoading(true);
    try {
      const res = await fetch('/api/send-master-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail, 
          targetPhone: phoneNumber 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP Sent to Telegram!");
        setStep(2);
      } else {
        toast.error(data.error || "Sending failed");
      }
    } catch (err) {
      toast.error("Master Node Connection Error");
    }
    setLoading(false);
  };

  // OTP Verification Logic
  const verifyOtp = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) return toast.warning("Poora OTP daalein!");

    setLoading(true);
    try {
      // Yahan aapka verify API aayega
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp: finalOtp }),
      });
      const data = await res.json();

      if (data.success) {
        setIsVerified(true);
        toast.success("Neural 2FA Activated!");
        setStep(1); // Wapas number view par par verified status ke saath
      } else {
        toast.error("Invalid Code!");
      }
    } catch (err) {
      toast.error("Verification failed");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in slide-in-from-right duration-500">
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
          Protect your Gmail identity via Master Node
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${is2FAEnabled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[#111] border-white/5'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                    {isVerified ? 'Secure link active' : 'Link your phone number'}
                  </p>
                </div>
                <button 
                  onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {is2FAEnabled && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-4 text-zinc-500" size={20} />
                        <input 
                          type="text" 
                          placeholder="+91 00000 00000"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={isVerified}
                          className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                        />
                        {isVerified && <CheckCircle2 className="absolute right-4 top-4 text-green-500" size={20} />}
                      </div>
                      {!isVerified && (
                        <button 
                          onClick={requestOtp}
                          disabled={loading}
                          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Verification Code'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            className="w-12 h-14 bg-zinc-900 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-blue-500 outline-none"
                          />
                        ))}
                      </div>
                      <button 
                        onClick={verifyOtp}
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-black py-4 rounded-2xl uppercase hover:bg-green-500 transition-all"
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Activate'}
                      </button>
                      <button onClick={() => setStep(1)} className="text-xs text-zinc-500 uppercase font-bold hover:text-white">Back to number</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Info */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-tighter">
                <Fingerprint size={16} className="text-blue-500" /> Neural Info
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                OTP will be delivered via <b className="text-zinc-200">BaseKey Master Node</b>. Tap the code in Telegram to copy it instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                    }
                
