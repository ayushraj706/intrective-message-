import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Power, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';

// Anti-crash for Next.js SSR
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

  useEffect(() => {
    setMounted(true);
    const fetchStatus = async () => {
      // LocalStorage access inside useEffect to prevent hydration error
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

  // --- OTP HELPERS ---
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const requestOtp = async () => {
    if (phoneNumber.length < 10) return toast.error("Please enter a complete phone number.");
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
      } else { toast.error(data.error || "Telegram node timeout."); }
    } catch (err) { toast.error("Connection link failed."); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) return toast.warning("Enter 6-digit code.");
    setLoading(true);
    try {
      const emailToUse = userEmail || localStorage.getItem('admin_email');
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: emailToUse, otp: finalOtp, targetPhone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        toast.success("Neural 2FA Activated!");
      } else { toast.error(data.error || "Incorrect sequence."); }
    } catch (err) { toast.error("Verification system error."); }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!confirm("Deactivate 2FA? This will lower your account security.")) return;
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
        setPhoneNumber('');
        toast.error("2FA Node Deactivated.");
      }
    } catch (err) { toast.error("Override failed."); }
    setLoading(false);
  };

  if (!mounted) return null;

  if (syncing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#00A884]" size={32} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing Security Layers...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 bg-[#F0F2F5] min-h-screen text-[#1C1E21] font-sans">
      <button onClick={onBack} className="flex items-center gap-2 text-[#606770] hover:text-[#00A884] mb-8 font-bold text-xs uppercase transition-all">
        <ArrowLeft size={16} /> Master Dashboard
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className={`p-3 rounded-xl ${isVerified ? 'bg-[#00A884]/10 text-[#00A884]' : 'bg-gray-200 text-gray-500'}`}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Two-Step Verification</h2>
            <p className="text-xs text-[#606770]">Add an extra layer of security to your administrative account.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#DDD] overflow-hidden">
          <div className="p-8">
            {/* TOGGLE SECTION */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1">
                <h3 className="font-bold text-lg">2FA Security Node</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isVerified ? 'text-[#00A884]' : 'text-red-500'}`}>
                  {isVerified ? 'Enabled • Secure' : 'Disabled • Vulnerable'}
                </p>
              </div>
              
              {!isVerified && (
                <button 
                  onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  className={`w-14 h-7 rounded-full transition-all relative shrink-0 ${is2FAEnabled ? 'bg-[#00A884]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${is2FAEnabled ? 'left-8' : 'left-1'}`} />
                </button>
              )}
            </div>

            {is2FAEnabled && !isVerified && (
              <div className="space-y-6 pt-6 border-t border-[#F0F2F5] animate-in slide-in-from-top duration-500">
                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="phone-meta-wrapper">
                      <label className="text-[11px] font-bold text-[#4B4F56] uppercase mb-2 block ml-1">Connect Telegram Number</label>
                      <PhoneInput
                        country={'in'}
                        value={phoneNumber}
                        onChange={p => setPhoneNumber(p)}
                        enableSearch={true}
                        containerClass="!w-full"
                        inputClass="!w-full !h-12 !bg-[#F5F6F7] !border-[#DDD] !rounded-lg !pl-14 !text-base focus:!border-[#00A884] focus:!ring-0"
                        buttonClass="!bg-transparent !border-none !rounded-lg !pl-3"
                        dropdownClass="!bg-white !shadow-xl !border-[#DDD] !rounded-lg"
                      />
                    </div>
                    <button 
                      onClick={requestOtp} 
                      disabled={loading} 
                      className="w-full h-12 bg-[#00A884] hover:bg-[#008F70] text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Verification Code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in zoom-in duration-300">
                    <div className="text-center">
                      <p className="text-xs text-[#606770] mb-4">Enter the 6-digit code sent to your Telegram.</p>
                      <div className="flex justify-between gap-2 max-w-xs mx-auto">
                        {otp.map((digit, i) => (
                          <input
                            key={i} 
                            ref={el => otpRefs.current[i] = el}
                            type="text" 
                            inputMode="numeric"
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            className="w-full h-12 bg-[#F5F6F7] border-b-2 border-[#DDD] text-center text-xl font-bold focus:border-[#00A884] outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={verifyOtp} 
                      disabled={loading} 
                      className="w-full h-12 bg-[#1C1E21] hover:bg-black text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Identity'}
                    </button>
                    <button onClick={() => setStep(1)} className="w-full text-xs font-bold text-[#00A884] hover:underline">Change Number</button>
                  </div>
                )}
              </div>
            )}

            {isVerified && (
              <div className="space-y-6 pt-6 border-t border-[#F0F2F5]">
                <div className="flex items-center gap-4 p-4 bg-[#E7F3FF] border border-[#00A884]/10 rounded-xl">
                  <CheckCircle2 className="text-[#00A884]" size={24} />
                  <p className="text-sm font-bold text-[#1C1E21]">Verified: +{phoneNumber}</p>
                </div>
                <button 
                  onClick={handleDisable} 
                  disabled={loading} 
                  className="w-full h-11 border border-red-100 text-red-500 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Power size={14} />} Disable Verification
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-[#F5F6F7] p-4 flex gap-3 items-start">
             <Info size={16} className="text-[#606770] shrink-0 mt-0.5" />
             <p className="text-[11px] text-[#606770] leading-relaxed">
               Two-step verification adds more security to your account by requiring a security code whenever you log in from a new node.
             </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .phone-meta-wrapper .country-list { background: white !important; color: #1C1E21 !important; }
        .phone-meta-wrapper .country-list .search { background: #F5F6F7 !important; padding: 10px !important; }
        .phone-meta-wrapper .country-list .search-box { background: white !important; border: 1px solid #DDD !important; width: 90% !important; border-radius: 6px !important; }
        .phone-meta-wrapper .country-list .country:hover { background: #F0F2F5 !important; }
        .phone-meta-wrapper .country-list .country.highlight { background: #E7F3FF !important; color: #00A884 !important; }
      `}</style>
    </div>
  );
                          }
                                 
