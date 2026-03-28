import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';
import { Shield, Loader2, Mail, ArrowLeft, Fingerprint, RefreshCw, Smartphone, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if ((step === 2 || step === 3) && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- LOGIC: REQUEST PRIMARY ACCESS ---
  const requestEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.warning("Email is required");

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, type: 'login' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security code sent to your email.");
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "Failed to send code.");
      }
    } catch (err) { toast.error("Network Error"); }
    setLoading(false);
  };

  // --- LOGIC: VERIFY & REDIRECT ---
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const finalOtp = otp.join('');
    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          otp: finalOtp, 
          type: step === 2 ? 'login' : '2fa' 
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.require2FA && step === 2) {
          toast.info("Secondary Verification Required");
          setPhone(data.phoneNumber);
          setStep(3);
          setOtp(['', '', '', '', '', '']);
          // Trigger Telegram OTP Automatically
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, type: '2fa', targetPhone: data.phoneNumber }),
          });
          setTimer(30);
        } else if (data.token) {
          // REDIRECT TO DASHBOARD
          await signInWithCustomToken(auth, data.token);
          localStorage.setItem('admin_email', cleanEmail);
          toast.success("Authentication successful.");
          router.push('/dashboard'); 
        }
      } else { toast.error(data.error); }
    } catch (err) { toast.error("Verification failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-[#1C1E21]">
      
      {/* Meta Developer Header Style */}
      <div className="w-full max-w-[400px] text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-4">
           <div className="bg-[#00A884] p-2 rounded-lg text-white">
              <Shield size={28} />
           </div>
           <h1 className="text-2xl font-bold tracking-tight">BaseKey <span className="text-[#00A884]">Developers</span></h1>
        </div>
        <p className="text-sm text-[#606770]">Log in to manage your neural business nodes</p>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-lg border border-[#DDDFE2] overflow-hidden">
        
        {/* Step Indicator Bar */}
        <div className="h-1.5 w-full bg-[#EBEDF0] flex">
           <div className={`h-full bg-[#00A884] transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        <div className="p-8">
          {step > 1 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[11px] font-bold text-[#00A884] uppercase mb-6 hover:underline">
              <ArrowLeft size={14} /> Change Account
            </button>
          )}

          <h2 className="text-xl font-bold mb-1">
            {step === 1 ? 'Identity Verification' : step === 2 ? 'Enter Email Code' : 'Verify Telegram Node'}
          </h2>
          <p className="text-sm text-[#606770] mb-8">
            {step === 1 ? 'Enter your administrative email to continue.' : `Security code sent to ${step === 3 ? 'Telegram' : email}`}
          </p>

          {step === 1 ? (
            <form onSubmit={requestEmailOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4B4F56] ml-1">WORK EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D949E]" size={18} />
                  <input 
                    type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 bg-[#F5F6F7] border border-[#DDD] rounded-lg pl-12 pr-4 outline-none focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/10 transition-all"
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full h-12 bg-[#00A884] hover:bg-[#008F70] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} ref={(el) => (inputRefs.current[idx] = el)} type="text" inputMode="numeric" value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-14 bg-[#F5F6F7] border border-[#DDD] rounded-lg text-center text-xl font-bold focus:border-[#00A884] outline-none transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <button disabled={loading || otp.join('').length < 6} className="w-full h-12 bg-[#1C1E21] hover:bg-[#000] text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-md">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Identity'}
                </button>
                
                <div className="text-center">
                   {canResend ? (
                      <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#00A884] hover:underline flex items-center justify-center gap-1 mx-auto">
                        <RefreshCw size={12} /> Resend Security Sequence
                      </button>
                   ) : (
                      <p className="text-xs text-[#606770]">Resend available in {timer}s</p>
                   )}
                </div>
              </div>

              {step === 3 && (
                <div className="p-4 bg-[#E7F3FF] border border-[#00A884]/20 rounded-lg flex gap-3">
                   <Smartphone className="text-[#00A884] shrink-0" size={18} />
                   <p className="text-[11px] text-[#1C1E21] leading-relaxed">
                     <b>Telegram Security:</b> A notification was sent to your connected device. Tap the notification to view the 6-digit code.
                   </p>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="bg-[#F5F6F7] p-4 border-t border-[#DDD] flex justify-between items-center">
           <span className="text-[10px] font-bold text-[#90949C] uppercase tracking-wider">BaseKey Auth Node v2.0.4</span>
           <div className="flex gap-4">
              <Lock size={14} className="text-[#BEC3C9]" />
           </div>
        </div>
      </div>

      <div className="mt-8 flex gap-6 text-xs text-[#606770] font-medium">
         <a href="#" className="hover:underline flex items-center gap-1">Documentation <ExternalLink size={10} /></a>
         <a href="#" className="hover:underline">Privacy Policy</a>
         <a href="#" className="hover:underline">Contact Security</a>
      </div>
    </div>
  );
                  }
                  
