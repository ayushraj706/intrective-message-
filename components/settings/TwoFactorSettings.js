import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Smartphone, CheckCircle2, Loader2, RefreshCw, Power, ChevronDown, Globe } from 'lucide-react';
import { toast } from 'sonner';

// --- NEURAL DATA: Common Countries ---
const COUNTRIES = [
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "USA", code: "+1", flag: "🇺🇸" },
  { name: "UK", code: "+44", flag: "🇬🇧" },
  { name: "UAE", code: "+971", flag: "🇦🇪" },
  { name: "Canada", code: "+1", flag: "🇨🇦" }
];

export default function TwoFactorSettings({ onBack, userEmail = "" }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default: India
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true); 
  const otpRefs = useRef([]);
  const [activeEmail, setActiveEmail] = useState(userEmail);

  useEffect(() => {
    const emailToUse = activeEmail || localStorage.getItem('admin_email');
    setActiveEmail(emailToUse);

    const cachedStatus = localStorage.getItem(`2fa_status_${emailToUse}`);
    const cachedPhone = localStorage.getItem(`2fa_phone_${emailToUse}`);
    
    if (cachedStatus === 'active') {
      setIsVerified(true);
      setIs2FAEnabled(true);
      setPhoneNumber(cachedPhone ? cachedPhone.replace(/^\+91|^\+1|^\+44|^\+971/, '') : '');
    }

    const syncWithDB = async () => {
      try {
        const res = await fetch(`/api/2fa-engine?action=get-status&email=${emailToUse}`);
        const data = await res.json();
        
        if (data.twoFactorEnabled) {
          setIsVerified(true);
          setIs2FAEnabled(true);
          // Remove country code from number for display
          const cleanPhone = data.phoneNumber || '';
          setPhoneNumber(cleanPhone.replace(/^\+\d{1,3}/, ''));
          localStorage.setItem(`2fa_status_${emailToUse}`, 'active');
          localStorage.setItem(`2fa_phone_${emailToUse}`, cleanPhone);
        } else {
          localStorage.removeItem(`2fa_status_${emailToUse}`);
          setIsVerified(false);
        }
      } catch (err) { console.error("Neural Sync Error"); }
      finally { setSyncing(false); }
    };
    syncWithDB();
  }, []);

  const requestOtp = async () => {
    const fullPhone = `${selectedCountry.code}${phoneNumber.replace(/\D/g, '')}`;
    if (phoneNumber.length < 10) return toast.error("Enter valid phone sequence!");

    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send', 
          email: activeEmail, 
          targetPhone: fullPhone 
        }),
      });
      if ((await res.json()).success) {
        toast.success(`Security code sent to ${fullPhone}`);
        setStep(2);
      }
    } catch (err) { toast.error("Signal Lost"); }
    setLoading(false);
  };

  // ... (handleDisable2FA, verifyOtp, handleOtpChange functions from previous versions)

  const verifyOtp = async () => {
    const finalOtp = otp.join('');
    setLoading(true);
    try {
      const res = await fetch('/api/2fa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: activeEmail, otp: finalOtp }),
      });
      if ((await res.json()).success) {
        setIsVerified(true);
        localStorage.setItem(`2fa_status_${activeEmail}`, 'active');
        localStorage.setItem(`2fa_phone_${activeEmail}`, `${selectedCountry.code}${phoneNumber}`);
        toast.success("2FA Linked Permanently!");
      } else { toast.error("Invalid sequence."); }
    } catch (err) { toast.error("Verification error"); }
    setLoading(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm("Deactivate Security Protocol?")) return;
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
        toast.error("Security Layer Removed");
      }
    } catch (err) { toast.error("Override Failed"); }
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
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-blue-500 animate-pulse font-black text-[10px] tracking-widest uppercase italic">Scanning Nodes...</div>;
  }

  return (
    <div className="p-8 md:p-16 bg-[#080808] min-h-screen text-white font-sans animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-600 hover:text-white mb-8 group transition-colors">
        <ArrowLeft size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <ShieldCheck className={isVerified ? "text-[#00A884]" : "text-zinc-600"} size={36} />
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Neural <span className="text-[#00A884]">2FA</span>
          </h2>
        </div>

        <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 ${isVerified ? 'bg-[#00A884]/5 border-[#00A884]/20' : 'bg-[#111] border-white/5 shadow-2xl'}`}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
              <p className={`text-[10px] uppercase tracking-[0.2em] mt-1 font-black ${isVerified ? 'text-[#00A884]' : 'text-red-500'}`}>
                {isVerified ? 'System: Fully Encrypted' : 'System: Vulnerable'}
              </p>
            </div>
            {!isVerified && (
               <button onClick={() => setIs2FAEnabled(!is2FAEnabled)} className={`w-14 h-8 rounded-full transition-all relative ${is2FAEnabled ? 'bg-[#00A884]' : 'bg-zinc-800'}`}>
                 <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
               </button>
            )}
          </div>

          {is2FAEnabled && !isVerified && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {/* --- COUNTRY SELECTOR --- */}
                    <div className="relative">
                      <button 
                        onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                        className="h-16 px-4 bg-black border border-white/10 rounded-2xl flex items-center gap-2 hover:border-[#00A884]/50 transition-all min-w-[100px]"
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-sm font-bold">{selectedCountry.code}</span>
                        <ChevronDown size={14} className="text-zinc-500" />
                      </button>
                      
                      {isCountryMenuOpen && (
                        <div className="absolute top-18 left-0 w-48 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                          {COUNTRIES.map((c) => (
                            <button 
                              key={c.name}
                              onClick={() => { setSelectedCountry(c); setIsCountryMenuOpen(false); }}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-bold transition-colors border-b border-white/5 last:border-0"
                            >
                              <span>{c.flag}</span>
                              <span className="flex-1">{c.name}</span>
                              <span className="text-zinc-500">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 relative">
                      <input 
                        type="text" placeholder="Phone Number..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 focus:border-[#00A884] outline-none transition-all font-mono text-lg"
                      />
                    </div>
                  </div>
                  <button onClick={requestOtp} disabled={loading} className="w-full bg-[#00A884] text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:shadow-[0_0_30px_rgba(0,168,132,0.2)] transition-all flex items-center justify-center">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Transmit Neural OTP'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in">
                   <div className="flex justify-between gap-2">
                     {otp.map((digit, i) => (
                       <input
                         key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" value={digit}
                         onChange={e => handleOtpChange(i, e.target.value)}
                         className="w-full h-16 bg-black border border-white/10 rounded-2xl text-center text-2xl font-black focus:border-[#00A884] outline-none"
                       />
                     ))}
                   </div>
                   <button onClick={verifyOtp} disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all">
                     Verify Identity Sequence
                   </button>
                </div>
              )}
            </div>
          )}

          {isVerified && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-4 p-6 bg-[#00A884]/10 border border-[#00A884]/20 rounded-2xl shadow-inner">
                <CheckCircle2 className="text-[#00A884]" size={24} />
                <p className="text-sm font-bold uppercase tracking-tight italic">Node Linked: {selectedCountry.flag} +{phoneNumber.replace(/^\d{2,3}/, '')}</p>
              </div>
              <button onClick={handleDisable2FA} disabled={loading} className="w-full py-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                 Deactivate Neural 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
                }
                          
