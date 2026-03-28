import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, Loader2, Fingerprint, RefreshCw, Power, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true); // New: Initial Sync state
  const [isVerified, setIsVerified] = useState(false);
  const otpRefs = useRef([]);

  const [activeEmail, setActiveEmail] = useState(userEmail);

  // --- NEURAL SYNC: Fetch Status from Database ---
  useEffect(() => {
    const syncStatus = async () => {
      const emailToUse = activeEmail || localStorage.getItem('admin_email');
      if (!emailToUse) {
        setSyncing(false);
        return;
      }
      setActiveEmail(emailToUse);

      try {
        const res = await fetch(`/api/2fa-engine?action=get-status&email=${emailToUse}`);
        const data = await res.json();
        
        if (data.twoFactorEnabled) {
          setIsVerified(true);
          setIs2FAEnabled(true);
          setPhoneNumber(data.phoneNumber || '');
        }
      } catch (err) { 
        console.error("Neural Sync Failed"); 
      } finally {
        setSyncing(false); // Sync khatam hone par hi UI dikhao
      }
    };
    syncStatus();
  }, []);

  // --- MANUAL DISABLE LOGIC ---
  const handleDisable2FA = async () => {
    if (!confirm("Caution: Deactivating 2FA will make your account vulnerable. Continue?")) return;
    
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
        toast.error("Security Layer Removed");
      }
    } catch (err) { toast.error("System Override Failed"); }
    setLoading(false);
  };

  // ... (handlePaste, handleOtpChange, handleKeyDown functions remain same) ...
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1].focus();
  };

  const requestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return toast.error("Enter valid phone number!");
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: activeEmail, targetPhone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security Code Dispatched!");
        setStep(2);
      } else { toast.error(data.error || "Telegram node failed to respond."); }
    } catch (err) { toast.error("Connection Breach"); }
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
        toast.success("2FA Permanent Link Active!");
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Verification error"); }
    setLoading(false);
  };

  // --- LOADING STATE UI ---
  if (syncing) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Scanning Security Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in fade-in duration-700">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group active:scale-95">
        <ArrowLeft size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Master Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <ShieldCheck className={isVerified ? "text-blue-500" : "text-zinc-600"} size={32} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-blue-500">2FA Security</span>
          </h2>
        </div>
        <p className="text-zinc-600 mb-12 text-[10px] font-bold tracking-[0.3em] uppercase opacity-70">
          Identity: {activeEmail}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-700 ${isVerified ? 'bg-blue-600/5 border-blue-500/30' : 'bg-zinc-900/20 border-white/5'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                  <p className={`text-[9px] uppercase tracking-widest mt-1 font-black ${isVerified ? 'text-blue-500' : 'text-red-500'}`}>
                    {isVerified ? 'System Status: Fully Encrypted' : 'System Status: Vulnerable'}
                  </p>
                </div>
                {!isVerified && (
                   <button 
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                    className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-blue-600' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                )}
              </div>

              {is2FAEnabled && !isVerified && (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-5 text-zinc-500" size={20} />
                        <input 
                          type="text" placeholder="91XXXXXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 focus:border-blue-500/50 outline-none transition-all font-mono text-lg"
                        />
                      </div>
                      <button onClick={requestOtp} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Transmit Neural Signal'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between gap-2">
                        {otp.map((digit, i) => (
                          <input
                            key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                            className="w-full h-16 bg-black border border-white/10 rounded-2xl text-center text-2xl font-black focus:border-blue-500 outline-none"
                          />
                        ))}
                      </div>
                      <button onClick={verifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Identity'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isVerified && (
                <div className="space-y-6 animate-in zoom-in duration-500">
                  <div className="flex items-center gap-4 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <CheckCircle2 className="text-blue-500" size={24} />
                    <p className="text-sm font-bold tracking-tight">Active Node: +{phoneNumber}</p>
                  </div>
                  <button onClick={handleDisable2FA} disabled={loading} className="w-full py-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} className="inline mr-2" />} 
                    Deactivate 2FA Node
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
                    
