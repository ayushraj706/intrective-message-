import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Power, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

// Anti-crash dynamic import
const PhoneInput = dynamic(() => import('react-phone-input-2'), { ssr: false });
import 'react-phone-input-2/lib/style.css';

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [mounted, setMounted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const otpRefs = useRef([]);

  // --- IDENTITY SYNC (DATABASE ONLY) ---
  useEffect(() => {
    setMounted(true);
    const fetchStatus = async () => {
      // Email fetch logic
      const emailToUse = userEmail || (typeof window !== 'undefined' ? localStorage.getItem('admin_email') : '');
      if (!emailToUse) {
        setSyncing(false);
        return;
      }

      try {
        const res = await fetch(`/api/2fa-engine?action=get-status&email=${emailToUse}`);
        const data = await res.json();
        
        if (data.twoFactorEnabled) {
          setIsVerified(true);
          setIs2FAEnabled(true);
          setPhoneNumber(data.phoneNumber || '');
        }
      } catch (err) {
        console.error("Neural sync failed");
      } finally {
        setSyncing(false);
      }
    };

    fetchStatus();
  }, [userEmail]);

  // --- OTP LOGIC ---
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
    if (phoneNumber.length < 10) return toast.error("Invalid phone sequence!");
    setLoading(true);
    try {
      const emailToUse = userEmail || localStorage.getItem('admin_email');
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: emailToUse, targetPhone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security code sent via Telegram.");
        setStep(2);
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Connection link failed"); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const emailToUse = userEmail || localStorage.getItem('admin_email');
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: emailToUse, otp: otp.join(''), targetPhone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        toast.success("Identity Verified!");
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Verification error"); }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!confirm("Disable 2FA? Security will be at risk.")) return;
    setLoading(true);
    try {
      const emailToUse = userEmail || localStorage.getItem('admin_email');
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', email: emailToUse }),
      });
      if ((await res.json()).success) {
        setIsVerified(false);
        setIs2FAEnabled(false);
        setStep(1);
        toast.error("Security Node Offline");
      }
    } catch (err) { toast.error("Failed to disable"); }
    setLoading(false);
  };

  if (!mounted) return null;

  if (syncing) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-16 bg-[#080808] min-h-screen text-white font-sans selection:bg-[#00A884]/30">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-600 hover:text-white mb-10 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Master Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <ShieldCheck className={isVerified ? "text-[#00A884]" : "text-zinc-800"} size={44} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-[#00A884]">2FA</span>
          </h2>
        </div>

        <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 ${isVerified ? 'bg-[#00A884]/5 border-[#00A884]/20' : 'bg-[#111] border-white/5 shadow-2xl'}`}>
          
          {/* HEADER: Toggle on the right side */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex-1">
              <h3 className="text-xl font-bold tracking-tight">Two-Factor Authentication</h3>
              <p className={`text-[10px] uppercase tracking-[0.2em] mt-2 font-black ${isVerified ? 'text-[#00A884]' : 'text-red-600'}`}>
                {isVerified ? 'System Status: Active' : 'System Status: Vulnerable'}
              </p>
            </div>
            
            {!isVerified && (
               <button 
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={`w-16 h-8 rounded-full transition-all relative flex items-center shrink-0 ${is2FAEnabled ? 'bg-[#00A884]' : 'bg-zinc-800'}`}
              >
                <div className={`absolute w-6 h-6 rounded-full bg-white transition-all shadow-md ${is2FAEnabled ? 'left-9' : 'left-1'}`} />
              </button>
            )}
          </div>

          {is2FAEnabled && !isVerified && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="phone-meta-input">
                    <PhoneInput
                      country={'in'}
                      value={phoneNumber}
                      onChange={p => setPhoneNumber(p)}
                      enableSearch={true}
                      containerClass="!w-full"
                      inputClass="!w-full !h-16 !bg-black !border-zinc-800 !text-white !rounded-2xl !pl-16 !text-lg"
                      buttonClass="!bg-transparent !border-none !rounded-2xl !pl-4"
                      dropdownClass="!bg-[#111] !text-white !border-zinc-800"
                    />
                  </div>
                  <button onClick={requestOtp} disabled={loading} className="w-full bg-[#00A884] text-white font-black py-5 rounded-2xl uppercase tracking-widest active:scale-[0.98] transition-all">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Request Security Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in duration-300">
                   <div className="flex justify-between gap-2 md:gap-4">
                     {otp.map((digit, i) => (
                       <input
                         key={i} ref={el => otpRefs.current[i] = el}
                         type="text" value={digit}
                         onChange={e => handleOtpChange(i, e.target.value)}
                         onKeyDown={e => handleKeyDown(i, e)}
                         className="w-full h-16 bg-black border border-zinc-800 rounded-2xl text-center text-3xl font-black focus:border-[#00A884] outline-none"
                       />
                     ))}
                   </div>
                   <button onClick={verifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest transition-all">
                     Confirm Sequence
                   </button>
                </div>
              )}
            </div>
          )}

          {isVerified && (
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-[#00A884]/10 border border-[#00A884]/20 rounded-2xl">
                <CheckCircle2 className="text-[#00A884]" size={32} />
                <p className="text-sm font-bold tracking-tight uppercase italic">Linked Node: +{phoneNumber}</p>
              </div>
              <button onClick={handleDisable} disabled={loading} className="w-full py-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                 Deactivate 2FA Node
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .phone-meta-input .country-list { background: #111 !important; color: white !important; }
        .phone-meta-input .country-list .search { background: #111 !important; }
        .phone-meta-input .country-list .search-box { background: black !important; color: white !important; border: 1px solid #333 !important; }
        .phone-meta-input .country-list .country:hover { background: rgba(0, 168, 132, 0.1) !important; }
      `}</style>
    </div>
  );
                              }
            
