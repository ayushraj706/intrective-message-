import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, Loader2, Fingerprint, RefreshCw, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Ye DB se aayega
  const otpRefs = useRef([]);

  const [activeEmail, setActiveEmail] = useState(userEmail);

  // --- NEURAL SYNC: Fetch Initial Status from DB ---
  useEffect(() => {
    const syncStatus = async () => {
      const emailToUse = activeEmail || localStorage.getItem('admin_email');
      if (!emailToUse) return;
      setActiveEmail(emailToUse);

      try {
        // Maan lete hain aapka ek common get-config API hai
        const res = await fetch(`/api/2fa-engine?action=get-status&email=${emailToUse}`);
        const data = await res.json();
        if (data.twoFactorEnabled) {
          setIsVerified(true);
          setIs2FAEnabled(true);
          setPhoneNumber(data.phoneNumber);
        }
      } catch (err) { console.log("Sync failed"); }
    };
    syncStatus();
  }, [userEmail]);

  // --- MANUAL DISABLE LOGIC ---
  const handleDisable2FA = async () => {
    if (!confirm("Kya aap sach me 2FA band karna chahte hain? Security kam ho jayegi!")) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', email: activeEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(false);
        setIs2FAEnabled(false);
        setStep(1);
        setPhoneNumber('');
        toast.error("Neural 2FA Deactivated", { description: "Your account is now vulnerable." });
      }
    } catch (err) { toast.error("Disable failed"); }
    setLoading(false);
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs.current[5].focus(); 
      toast.success("Neural Code Applied!");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const requestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return toast.error("Valid phone number daalein!");
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: activeEmail, targetPhone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security Code Sent!");
        setStep(2);
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Connection Failed"); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    const finalOtp = otp.join('');
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: activeEmail, otp: finalOtp }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        toast.success("Neural 2FA Activated Permanently!");
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Verification failed"); }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in slide-in-from-right duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group active:scale-95">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest text-[10px]">Back to Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <ShieldCheck className="text-blue-500" size={32} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-blue-500">2FA Security</span>
          </h2>
        </div>
        <p className="text-zinc-500 mb-12 text-[10px] font-bold font-mono tracking-[0.3em] uppercase opacity-70">
          Identity: {activeEmail || "Detecting..."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${isVerified ? 'bg-blue-600/5 border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.05)]' : 'bg-[#111] border-white/5'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                  <p className={`text-[10px] uppercase tracking-widest mt-1 font-black ${isVerified ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {isVerified ? 'Secure link active' : 'Account status: Vulnerable'}
                  </p>
                </div>
                {!isVerified && (
                   <button 
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                    className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                )}
              </div>

              {is2FAEnabled && !isVerified && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-5 text-zinc-500" size={20} />
                        <input 
                          type="text" placeholder="919229966001" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full h-16 bg-zinc-900 border border-white/5 rounded-2xl pl-14 pr-6 focus:outline-none focus:border-blue-500/50 transition-all font-mono text-lg"
                        />
                      </div>
                      <button onClick={requestOtp} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-600/10">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Transmit Neural Signal'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8 text-center">
                      <div className="flex justify-between gap-2 md:gap-3">
                        {otp.map((digit, i) => (
                          <input
                            key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" value={digit}
                            onPaste={i === 0 ? handlePaste : undefined} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                            className="w-full h-16 bg-zinc-900 border border-white/10 rounded-2xl text-center text-2xl font-black focus:border-blue-500 outline-none transition-all shadow-inner"
                          />
                        ))}
                      </div>
                      <button onClick={verifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center active:scale-95">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Establish Secure Link'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isVerified && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-in zoom-in duration-500">
                    <CheckCircle2 className="text-blue-500" size={24} />
                    <div>
                      <p className="text-sm font-bold">Encrypted Connection Established</p>
                      <p className="text-[10px] text-blue-400/50 uppercase tracking-widest font-black">Linked to: +{phoneNumber}</p>
                    </div>
                  </div>
                  {/* MANUAL DISABLE BUTTON */}
                  <button 
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="w-full bg-red-600/10 hover:bg-red-600 border border-red-600/20 text-red-500 hover:text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />} 
                    Disable Security Protocol
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                        }
