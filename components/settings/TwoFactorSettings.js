import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Anti-crash import
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Power, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

// PhoneInput ko dynamic import kiya taaki server par crash na ho
const PhoneInput = dynamic(() => import('react-phone-input-2'), { ssr: false });
import 'react-phone-input-2/lib/style.css';

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [mounted, setMounted] = useState(false); // Anti-Hydration Error
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const otpRefs = useRef([]);
  const [activeEmail, setActiveEmail] = useState(userEmail);

  useEffect(() => {
    setMounted(true); // Component load ho gaya hai
    const syncNode = async () => {
      const emailToUse = activeEmail || localStorage.getItem('admin_email');
      if (!emailToUse) { setSyncing(false); return; }
      setActiveEmail(emailToUse);

      // Instant Cache Load
      const cached = localStorage.getItem(`2fa_status_${emailToUse}`);
      const cachedPhone = localStorage.getItem(`2fa_phone_${emailToUse}`);
      if (cached === 'active') {
        setIsVerified(true);
        setIs2FAEnabled(true);
        setPhoneNumber(cachedPhone || '');
      }

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
          setIsVerified(false);
          setIs2FAEnabled(false);
          localStorage.removeItem(`2fa_status_${emailToUse}`);
        }
      } catch (err) { console.error("Sync Error"); }
      finally { setSyncing(false); }
    };
    syncNode();
  }, []);

  const handleRequestOtp = async () => {
    if (phoneNumber.length < 10) return toast.error("Invalid phone!");
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: activeEmail, targetPhone: phoneNumber }),
      });
      if ((await res.json()).success) { setStep(2); toast.success("Code Sent!"); }
    } catch (err) { toast.error("Link Failed"); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: activeEmail, otp: otp.join(''), targetPhone: phoneNumber }),
      });
      if ((await res.json()).success) {
        setIsVerified(true);
        localStorage.setItem(`2fa_status_${activeEmail}`, 'active');
        localStorage.setItem(`2fa_phone_${activeEmail}`, phoneNumber);
        toast.success("Security Verified!");
      }
    } catch (err) { toast.error("Error"); }
    setLoading(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm("Disable Security?")) return;
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
        localStorage.removeItem(`2fa_status_${activeEmail}`);
        toast.error("2FA Disabled");
      }
    } catch (err) { toast.error("Failed"); }
    setLoading(false);
  };

  // Prevent rendering until mounted to avoid crash
  if (!mounted) return null;

  if (syncing) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Establishing Secure Link...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-16 bg-[#080808] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-600 hover:text-white mb-10 transition-all">
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
          
          {/* HEADER SECTION: Toggle button on the far right */}
          <div className="flex items-start justify-between mb-10 w-full">
            <div className="flex-1">
              <h3 className="text-xl font-bold tracking-tight">Two-Factor Authentication</h3>
              <p className={`text-[10px] uppercase tracking-[0.2em] mt-2 font-black ${isVerified ? 'text-[#00A884]' : 'text-red-600'}`}>
                {isVerified ? 'ENCRYPTED NODE ACTIVE' : 'SYSTEM STATUS: VULNERABLE'}
              </p>
            </div>
            
            {!isVerified && (
               <div className="ml-4">
                  <button 
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                    className={`w-16 h-8 rounded-full transition-all relative flex items-center ${is2FAEnabled ? 'bg-[#00A884]' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute w-6 h-6 rounded-full bg-white transition-all shadow-md ${is2FAEnabled ? 'left-9' : 'left-1'}`} />
                  </button>
               </div>
            )}
          </div>

          {is2FAEnabled && !isVerified && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="phone-picker-meta">
                    <PhoneInput
                      country={'in'}
                      value={phoneNumber}
                      onChange={phone => setPhoneNumber(phone)}
                      enableSearch={true}
                      containerClass="!w-full !rounded-2xl"
                      inputClass="!w-full !h-16 !bg-black !border-zinc-800 !text-white !rounded-2xl !pl-16 !text-lg"
                      buttonClass="!bg-transparent !border-none !rounded-2xl !pl-4"
                      dropdownClass="!bg-[#111] !text-white !border-zinc-800 !rounded-xl"
                      searchClass="!bg-black !text-white !mx-2 !my-2"
                    />
                  </div>
                  <button onClick={handleRequestOtp} disabled={loading} className="w-full bg-[#00A884] text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Establish Identity Link'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in duration-300">
                   <div className="flex justify-between gap-3">
                     {otp.map((digit, i) => (
                       <input
                         key={i} type="text" maxLength="1" value={digit}
                         onChange={e => {
                            const newOtp = [...otp];
                            newOtp[i] = e.target.value;
                            setOtp(newOtp);
                         }}
                         className="w-full h-16 bg-black border border-zinc-800 rounded-2xl text-center text-3xl font-black focus:border-[#00A884] outline-none"
                       />
                     ))}
                   </div>
                   <button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest transition-all">
                     Verify Sequence
                   </button>
                </div>
              )}
            </div>
          )}

          {isVerified && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-5 p-6 bg-[#00A884]/10 border border-[#00A884]/20 rounded-2xl">
                <CheckCircle2 className="text-[#00A884]" size={32} />
                <p className="text-sm font-bold tracking-tight uppercase italic font-mono">Linked Node: +{phoneNumber}</p>
              </div>
              <button onClick={handleDisable2FA} disabled={loading} className="w-full py-5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                 Deactivate Neural Security
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .phone-picker-meta .form-control:focus { box-shadow: none !important; border-color: #00A884 !important; }
        .phone-picker-meta .country-list { background: #111 !important; }
        .phone-picker-meta .country-list .country:hover { background: rgba(0, 168, 132, 0.1) !important; }
        .phone-picker-meta .country-list .country.highlight { background: #00A884 !important; }
      `}</style>
    </div>
  );
            }
                       
