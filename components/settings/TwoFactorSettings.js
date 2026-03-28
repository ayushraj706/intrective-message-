import React, { useState, useRef, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; // Neural CSS Link
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Power, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const otpRefs = useRef([]);

  const [activeEmail, setActiveEmail] = useState(userEmail);

  // --- NEURAL SYNC PROTOCOL (LocalStorage + Firestore) ---
  useEffect(() => {
    const syncNode = async () => {
      const emailToUse = activeEmail || localStorage.getItem('admin_email');
      if (!emailToUse) {
        setSyncing(false);
        return;
      }
      setActiveEmail(emailToUse);

      // 1. Instant Cache Check (Zero Flicker)
      const cached = localStorage.getItem(`2fa_status_${emailToUse}`);
      const cachedPhone = localStorage.getItem(`2fa_phone_${emailToUse}`);
      if (cached === 'active') {
        setIsVerified(true);
        setIs2FAEnabled(true);
        setPhoneNumber(cachedPhone || '');
      }

      // 2. Server Side Audit (Verify from DB)
      try {
        const res = await fetch(`/api/2fa-engine?action=get-status&email=${emailToUse}`);
        const data = await res.json();
        
        if (data.twoFactorEnabled) {
          setIsVerified(true);
          setIs2FAEnabled(true);
          setPhoneNumber(data.phoneNumber);
          localStorage.setItem(`2fa_status_${emailToUse}`, 'active');
          localStorage.setItem(`2fa_phone_${emailToUse}`, data.phoneNumber);
        } else {
          // If DB says OFF, reset everything
          setIsVerified(false);
          setIs2FAEnabled(false);
          localStorage.removeItem(`2fa_status_${emailToUse}`);
        }
      } catch (err) { console.error("Neural sync interrupted."); }
      finally { setSyncing(false); }
    };

    syncNode();
  }, [userEmail]);

  // --- ACTION: DISPATCH OTP ---
  const handleRequestOtp = async () => {
    if (phoneNumber.length < 10) return toast.error("Enter valid phone sequence!");
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send', 
          email: activeEmail, 
          targetPhone: phoneNumber // Format: "919229966001" (Library handles + automatically)
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security code dispatched via Telegram.");
        setStep(2);
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Connection Breach"); }
    setLoading(false);
  };

  // --- ACTION: VERIFY IDENTITY ---
  const handleVerifyOtp = async () => {
    const finalOtp = otp.join('');
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify', 
          email: activeEmail, 
          otp: finalOtp,
          targetPhone: phoneNumber 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        localStorage.setItem(`2fa_status_${activeEmail}`, 'active');
        localStorage.setItem(`2fa_phone_${activeEmail}`, phoneNumber);
        toast.success("Identity Sequence Verified Permanently.");
      } else { toast.error(data.error); }
    } catch (err) { toast.error("System Override Failed"); }
    setLoading(false);
  };

  // --- ACTION: DEACTIVATE PROTOCOL ---
  const handleDisable2FA = async () => {
    if (!confirm("Deactivate Security Node? Account will be vulnerable.")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', email: activeEmail }),
      });
      if ((await res.json()).success) {
        setIsVerified(false);
        setIs2FAEnabled(false);
        setStep(1);
        localStorage.removeItem(`2fa_status_${activeEmail}`);
        toast.error("Security Node Offline");
      }
    } catch (err) { toast.error("Deactivation failed."); }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  if (syncing) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-blue-500 font-black text-[10px] tracking-[0.4em] uppercase">Scanning Security Layers...</div>;
  }

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in fade-in duration-700">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-600 hover:text-white mb-8 transition-all group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Master Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-5 mb-12">
          <ShieldCheck className={isVerified ? "text-[#00A884]" : "text-zinc-700"} size={40} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-[#00A884]">2FA Protocol</span>
          </h2>
        </div>

        <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 ${isVerified ? 'bg-[#00A884]/5 border-[#00A884]/30 shadow-[0_0_50px_rgba(0,168,132,0.05)]' : 'bg-[#111] border-white/5 shadow-2xl'}`}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Two-Factor Authentication</h3>
              <p className={`text-[10px] uppercase tracking-[0.2em] mt-2 font-black ${isVerified ? 'text-[#00A884]' : 'text-red-600'}`}>
                {isVerified ? 'System Status: Active & Encrypted' : 'System Status: Vulnerable'}
              </p>
            </div>
            {!isVerified && (
               <button 
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={`w-16 h-9 rounded-full transition-all relative ${is2FAEnabled ? 'bg-[#00A884]' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-1.5 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-8.5 shadow-lg' : 'left-1.5'}`} />
              </button>
            )}
          </div>

          {is2FAEnabled && !isVerified && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="phone-picker-container">
                    <PhoneInput
                      country={'in'}
                      value={phoneNumber}
                      onChange={phone => setPhoneNumber(phone)}
                      enableSearch={true} // SEARCH BAR ACTIVE
                      containerClass="neural-phone-container"
                      inputClass="neural-phone-input"
                      buttonClass="neural-phone-button"
                      dropdownClass="neural-phone-dropdown"
                      searchPlaceholder="Search Node..."
                    />
                  </div>
                  <button onClick={handleRequestOtp} disabled={loading} className="w-full bg-[#00A884] text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-[#008F70] transition-all flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Establish Telegram Link'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in">
                   <div className="flex justify-between gap-2 md:gap-4">
                     {otp.map((digit, i) => (
                       <input
                         key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" value={digit}
                         onChange={e => handleOtpChange(i, e.target.value)}
                         className="w-full h-16 bg-black border border-white/10 rounded-2xl text-center text-3xl font-black focus:border-[#00A884] focus:ring-4 focus:ring-[#00A884]/10 outline-none transition-all"
                       />
                     ))}
                   </div>
                   <button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest active:scale-[0.98] transition-all">
                     {loading ? <Loader2 className="animate-spin text-zinc-400" size={20} /> : 'Confirm Sequence'}
                   </button>
                </div>
              )}
            </div>
          )}

          {isVerified && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-[#00A884]/10 border border-[#00A884]/20 rounded-2xl">
                <CheckCircle2 className="text-[#00A884]" size={28} />
                <div>
                  <p className="text-sm font-bold tracking-tight italic">ENCRYPTED NODE ACTIVE</p>
                  <p className="text-[10px] text-[#00A884]/60 font-black uppercase tracking-widest">Phone: +{phoneNumber}</p>
                </div>
              </div>
              <button onClick={handleDisable2FA} disabled={loading} className="w-full py-5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]">
                 Deactivate Neural Identity Link
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .neural-phone-container { width: 100% !important; border-radius: 1.5rem !important; }
        .neural-phone-input { 
          width: 100% !important; height: 64px !important; background: black !important; 
          border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 1.5rem !important;
          color: white !important; font-family: monospace !important; font-size: 18px !important; padding-left: 60px !important;
        }
        .neural-phone-button { 
          background: transparent !important; border: none !important; border-radius: 1.5rem 0 0 1.5rem !important;
          padding-left: 15px !important;
        }
        .neural-phone-dropdown { 
          background: #111 !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 1rem !important; width: 300px !important;
        }
        .neural-phone-dropdown li:hover { background: rgba(0,168,132,0.1) !important; }
        .neural-phone-dropdown .search { background: #111 !important; padding: 10px !important; }
        .neural-phone-dropdown .search-box { 
          background: black !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 0.5rem !important; width: 90% !important;
        }
      `}</style>
    </div>
  );
  }
                               
