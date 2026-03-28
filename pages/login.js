import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';
import { ShieldCheck, Loader2, Mail, ArrowLeft, Fingerprint, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const pasteOtp = data.split('');
      setOtp(pasteOtp);
      inputRefs.current[5].focus();
      toast.success("Neural Code Automatically Applied!");
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.warning("Admin Email dalna zaroori hai!");

    setLoading(true);
    try {
      // FIX: URL ko '/api/send-otp' kar diya hai taaki connection fail na ho
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail,
          type: 'login' // Ye prefix ke liye zaroori hai
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Security Code Dispatched!", { description: "Email/Telegram check karein." });
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "OTP bhejne mein dikkat aayi.");
      }
    } catch (err) { 
      toast.error("Connection Failed", { description: "API Response nahi mila. Internet ya Vercel check karein." }); 
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setTimer(30);
    setCanResend(false);
    toast.info("Resending Neural Code...");
    await handleSendOtp();
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const finalOtp = otp.join('');
    const cleanEmail = email.trim().toLowerCase();
    
    if (finalOtp.length < 6) return toast.warning("Poora 6-digit OTP daalein!");

    setLoading(true);
    try {
      // FIX: Verify endpoint path ensure kiya gaya hai
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          otp: finalOtp,
          type: 'login' 
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.token) {
        toast.success("Identity Verified!", { description: "Redirecting..." });
        await signInWithCustomToken(auth, data.token);
        
        localStorage.setItem('admin_email', cleanEmail); 
        localStorage.setItem('basekey_session', 'authenticated');
        
        router.push('/dashboard');
      } else {
        toast.error(data.error || "Invalid or Expired Security Code.");
      }
    } catch (err) { 
        toast.error("Verification Error", { description: err.message }); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#020202] flex items-center justify-center p-6 text-zinc-900 dark:text-white font-sans overflow-hidden transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[450px] bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-[3rem] p-10 md:p-12 text-center shadow-2xl relative z-10 transition-all duration-300">
        
        {step === 2 && (
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all bg-zinc-100 dark:bg-white/5 p-2 rounded-full active:scale-90">
            <ArrowLeft size={18} />
          </button>
        )}
        
        <div className="mb-8 inline-flex p-5 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20 text-blue-600 dark:text-blue-500">
          {step === 1 ? <ShieldCheck size={40} /> : <Fingerprint size={40} className="animate-pulse" />}
        </div>
        
        <h1 className="text-4xl font-black mb-2 tracking-tighter italic uppercase">Base<span className="text-blue-600">Key</span></h1>
        
        {step === 1 ? (
           <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-[10px] uppercase tracking-[0.3em] font-bold">Secure Admin Neural Link</p>
        ) : (
           <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-xs font-medium italic opacity-80 break-all">{email}</p>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6 text-left animate-in slide-in-from-bottom duration-500">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="email" 
                required 
                placeholder="Enter Admin Email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl py-4.5 pl-14 pr-6 outline-none focus:border-blue-500/50 transition-all text-sm font-medium h-14 shadow-inner"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4.5 rounded-3xl transition-all shadow-xl active:scale-95 h-14">
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Request Secure Access'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-full h-14 md:h-16 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-2xl text-center text-2xl font-black focus:border-blue-500 outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex items-center justify-center text-[10px] uppercase tracking-widest font-bold">
               {canResend ? (
                 <button type="button" onClick={handleResendOtp} className="text-blue-600 hover:text-blue-500 flex items-center gap-2">
                   <RefreshCw size={12} /> Resend Neural Code
                 </button>
               ) : (
                 <span className="text-zinc-500">Resend in 00:{timer < 10 ? `0${timer}` : timer}</span>
               )}
            </div>

            <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full bg-zinc-900 dark:bg-white dark:text-black text-white font-black py-4.5 rounded-3xl transition-all shadow-xl active:scale-95 h-14 flex items-center justify-center uppercase tracking-widest text-xs">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Identity'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-white/5 opacity-40">
          <p className="text-[9px] uppercase tracking-[0.4em] font-black italic text-zinc-500">BaseKey OS v2.0.4 • Admin Portal</p>
        </div>
      </div>
    </div>
  );
                 }
                                                               
