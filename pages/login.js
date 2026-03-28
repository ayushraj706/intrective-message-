import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';
import { Shield, Loader2, Mail, ArrowLeft, RefreshCw, Smartphone, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Email, 2: Email OTP, 3: Telegram 2FA
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false); // Redirect safety
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic
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

  // --- STEP 1: REQUEST EMAIL ---
  const requestEmailOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: 'login' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Verification code sent.");
        setStep(2);
        setTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(data.error || "Failed to send code.");
      }
    } catch (err) { toast.error("Connection failed."); }
    setLoading(false);
  };

  // --- STEP 2 & 3: VERIFY & REDIRECT ---
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const finalOtp = otp.join('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: finalOtp, 
          type: step === 2 ? 'login' : '2fa' 
        }),
      });
      const data = await res.json();

      if (data.success) {
        // NEURAL 2FA CHECK: Agar backend bole ki 2FA chahiye
        if (data.require2FA && step === 2) {
          toast.info("Telegram verification required.");
          setPhone(data.phoneNumber);
          setStep(3); // Moving to Telegram Step
          setOtp(['', '', '', '', '', '']);
          setTimer(30);
          // Trigger Telegram OTP
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), type: '2fa', targetPhone: data.phoneNumber }),
          });
        } 
        else if (data.token) {
          // FINAL LOGIN SUCCESS
          setAuthSuccess(true);
          await signInWithCustomToken(auth, data.token);
          localStorage.setItem('admin_email', email.trim().toLowerCase());
          localStorage.setItem('is_auth', 'true');
          toast.success("Authenticated successfully!");
          
          // Redirecting to Dashboard
          router.push('/dashboard'); 
        }
      } else {
        toast.error(data.error || "Invalid code.");
      }
    } catch (err) { toast.error("Verification error."); }
    setLoading(false);
  };

  if (authSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#00A884]" size={40} />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Entering Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-[#1C1E21]">
      
      {/* Meta Header */}
      <div className="w-full max-w-[450px] text-center mb-8">
        <h1 className="text-[28px] font-bold text-[#00A884] mb-2">BaseKey Business</h1>
        <p className="text-[#606770] text-sm">Verify your administrative account to continue.</p>
      </div>

      <div className="w-full max-w-[450px] bg-white rounded-lg shadow-md border border-[#DDD] p-8 md:p-12">
        <h2 className="text-xl font-bold mb-2">
          {step === 1 ? 'Log In' : step === 2 ? 'Verify Email' : 'Telegram 2-Step'}
        </h2>
        <p className="text-sm text-[#606770] mb-8">
          {step === 1 ? 'Enter the email address linked to your developer account.' : 
           step === 2 ? `Enter the 6-digit code we sent to ${email}.` : 
           `Confirm your identity with the code sent to Telegram (+${phone}).`}
        </p>

        {step === 1 ? (
          <form onSubmit={requestEmailOtp} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#4B4F56] uppercase ml-1">Email Address</label>
              <input 
                type="email" required placeholder="admin@basekey.fun" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white border border-[#DDD] rounded-md px-4 outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition-all text-[15px]"
              />
            </div>
            <button disabled={loading} className="w-full h-11 bg-[#00A884] hover:bg-[#008F70] text-white font-bold rounded-md transition-all flex items-center justify-center shadow-sm">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx} ref={(el) => (inputRefs.current[idx] = el)} type="text" inputMode="numeric" value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-full h-14 bg-white border-b-2 border-[#DDD] text-center text-2xl font-bold focus:border-[#00A884] outline-none transition-all"
                />
              ))}
            </div>

            <div className="space-y-4">
              <button disabled={loading || otp.join('').length < 6} className="w-full h-11 bg-[#1C1E21] hover:bg-black text-white font-bold rounded-md transition-all flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify'}
              </button>
              
              <div className="text-center">
                {canResend ? (
                  <button type="button" onClick={requestEmailOtp} className="text-xs font-bold text-[#00A884] hover:underline flex items-center justify-center gap-1 mx-auto">
                    <RefreshCw size={12} /> Resend Code
                  </button>
                ) : (
                  <p className="text-[11px] text-[#90949C]">Resend available in {timer}s</p>
                )}
              </div>
            </div>

            {step === 3 && (
              <div className="p-4 bg-[#E7F3FF] border border-[#00A884]/20 rounded-md flex gap-3">
                 <Smartphone className="text-[#00A884] shrink-0" size={18} />
                 <p className="text-[11px] text-[#1C1E21] leading-relaxed">
                   <b>Security Tip:</b> Open Telegram on your phone. A 6-digit verification code has been sent to your master node session.
                 </p>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="mt-8 flex gap-6 text-[11px] text-[#90949C] font-bold uppercase tracking-wider">
         <span>© 2026 BaseKey</span>
         <span className="hover:text-[#00A884] cursor-pointer transition-colors">Documentation</span>
         <span className="hover:text-[#00A884] cursor-pointer transition-colors">Privacy</span>
      </div>
    </div>
  );
          }
                    
