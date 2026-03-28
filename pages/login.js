import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';
import { ShieldCheck, Loader2, Mail, ArrowLeft, Fingerprint, RefreshCw, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Hidden until 2FA triggers
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Email Input, 2: Email OTP, 3: Telegram OTP
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic for OTP Resend
  useEffect(() => {
    let interval;
    if ((step === 2 || step === 3) && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
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
      toast.success("Neural Sequence Synchronized!");
    }
  };

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

  // --- ACTION: SEND EMAIL OTP ---
  const requestEmailOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.warning("Admin Credentials required!");

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, type: 'login' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Primary Security Dispatched");
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "Authentication Link Failed");
      }
    } catch (err) { toast.error("System Offline"); }
    setLoading(false);
  };

  // --- ACTION: VERIFY & CHECK 2FA ---
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
        // SCENARIO A: 2FA required after Email verification
        if (data.require2FA && step === 2) {
          toast.info("Secondary Layer Detected", { description: "Establishing Telegram Node..." });
          setPhone(data.phoneNumber);
          setStep(3); // Switch to Telegram Step
          setOtp(['', '', '', '', '', '']);
          // Trigger Telegram OTP Automatically
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, type: '2fa', targetPhone: data.phoneNumber }),
          });
          setTimer(30);
        } 
        // SCENARIO B: Final Login Success
        else if (data.token) {
          toast.success("Authentication Complete", { description: "Redirecting to Dashboard..." });
          await signInWithCustomToken(auth, data.token);
          localStorage.setItem('admin_email', cleanEmail);
          router.push('/dashboard');
        }
      } else {
        toast.error(data.error || "Security Sequence Mismatch");
      }
    } catch (err) { toast.error("Encrypted Link Breach"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans overflow-hidden">
      {/* Background Neural Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-zinc-600/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 text-center shadow-2xl relative z-10 backdrop-blur-3xl">
        
        {/* Status Indicators */}
        <div className="flex justify-center gap-1.5 mb-8">
            <div className={`h-1 w-10 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600' : 'bg-white/5'}`}></div>
            <div className={`h-1 w-10 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/5'}`}></div>
            <div className={`h-1 w-10 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/5'}`}></div>
        </div>

        <div className="mb-8 inline-flex p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 text-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          {step === 3 ? <Smartphone className="animate-pulse" size={32} /> : <ShieldCheck size={32} />}
        </div>
        
        <h1 className="text-3xl font-black mb-2 tracking-tighter italic uppercase">Base<span className="text-blue-600">Key</span></h1>
        <p className="text-zinc-500 text-[9px] uppercase tracking-[0.4em] font-black opacity-60 mb-10 italic">Secure Master Node v2.0.4</p>

        {step === 1 ? (
          <form onSubmit={requestEmailOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="email" required placeholder="Admin Email Protocol..." value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 outline-none focus:border-blue-500/30 transition-all text-sm font-medium h-14"
              />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98] h-14 uppercase tracking-widest text-[11px] transition-all">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Establish Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-500 italic">
                    {step === 2 ? 'Verify Primary Node' : 'Secondary 2FA Active'}
                </span>
                <p className="text-xs text-zinc-500 italic opacity-80 break-all">{step === 3 ? `Telegram: +${phone}` : email}</p>
            </div>

            <div className="flex justify-between gap-2 md:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx} ref={(el) => (inputRefs.current[idx] = el)} type="text" inputMode="numeric" value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black focus:border-blue-500 outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
                <button onClick={handleVerify} disabled={loading || otp.join('').length < 6} className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4.5 rounded-2xl transition-all shadow-xl active:scale-[0.98] h-14 flex items-center justify-center uppercase tracking-widest text-[11px]">
                {loading ? <Loader2 className="animate-spin text-zinc-400" size={20} /> : 'Confirm Identity'}
                </button>
                
                <div className="flex items-center justify-center text-[9px] uppercase tracking-[0.2em] font-black">
                {canResend ? (
                    <button type="button" onClick={() => step === 2 ? requestEmailOtp() : toast.info("Check Telegram again")} className="text-blue-500 hover:text-blue-400 flex items-center gap-2">
                    <RefreshCw size={10} /> Request New Sequence
                    </button>
                ) : (
                    <span className="text-zinc-600 flex items-center gap-2">
                    <Lock size={10} /> Next Sync in 00:{timer < 10 ? `0${timer}` : timer}
                    </span>
                )}
                </div>
            </div>
          </div>
        )}

        {/* Dynamic Instruction Node */}
        {step === 3 && (
            <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl animate-in slide-in-from-top">
                <p className="text-[9px] text-zinc-400 font-medium leading-relaxed uppercase tracking-wider">
                   Security Protocol: Open Telegram to receive your 2FA Node. Identity verification is required for connected accounts.
                </p>
            </div>
        )}

        <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-center gap-4 opacity-30">
          <p className="text-[8px] uppercase tracking-[0.5em] font-black italic text-zinc-500">BaseKey OS Encryption Node</p>
        </div>
      </div>
    </div>
  );
}
