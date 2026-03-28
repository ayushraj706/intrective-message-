import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; 
import { signInWithCustomToken } from 'firebase/auth';
import { ShieldCheck, Loader2, Mail, ArrowLeft, Fingerprint, RefreshCw, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [method, setMethod] = useState('email'); // 'email' or 'telegram'
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
    if (step === 2 && timer > 0) {
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
      toast.success("Neural Code Synchronized!");
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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    
    if (method === 'email' && !email.trim()) return toast.warning("Admin Email is required!");
    if (method === 'telegram' && !phone.trim()) return toast.warning("Phone number is required!");

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: method,
          email: method === 'email' ? email.trim().toLowerCase() : null,
          phoneNumber: method === 'telegram' ? phone.trim() : null
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (method === 'telegram') setEmail(data.email); // Auto-capture linked email
        toast.success("Neural Link Established", { description: `Code sent via ${method === 'email' ? 'Email' : 'Telegram'}` });
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "Authentication Node Busy");
      }
    } catch (err) { 
      toast.error("Network Latency Error", { description: "Master Node unreachable." }); 
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) return toast.warning("Complete the 6-digit sequence!");

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: finalOtp }),
      });
      
      const data = await res.json();
      
      if (data.success && data.token) {
        toast.success("Identity Confirmed");
        await signInWithCustomToken(auth, data.token);
        localStorage.setItem('admin_email', email); 
        router.push('/dashboard');
      } else {
        toast.error(data.error || "Sequence Mismatch. Try again.");
      }
    } catch (err) { 
        toast.error("Verification Breach", { description: err.message }); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10 backdrop-blur-3xl transition-all duration-500 hover:border-white/10">
        
        {step === 2 && (
          <button onClick={() => setStep(1)} className="absolute top-10 left-10 text-zinc-500 hover:text-white transition-all bg-white/5 p-2 rounded-full active:scale-90">
            <ArrowLeft size={16} />
          </button>
        )}
        
        <div className="mb-8 inline-flex p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 text-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
          {step === 1 ? <ShieldCheck size={32} /> : <Fingerprint size={32} className="animate-pulse" />}
        </div>
        
        <h1 className="text-3xl font-black mb-2 tracking-tighter italic uppercase underline-offset-4 decoration-blue-500">
          Base<span className="text-blue-600">Key</span>
        </h1>
        
        {step === 1 ? (
          <div className="mb-10">
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.4em] font-black opacity-60">Neural Authentication v2</p>
            
            {/* Professional Toggle */}
            <div className="mt-8 flex bg-white/5 p-1 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-blue-600 rounded-xl transition-all duration-300 ease-out ${method === 'email' ? 'translate-x-0' : 'translate-x-full'}`}></div>
              <button 
                onClick={() => setMethod('email')}
                className={`flex-1 py-2.5 z-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-300 ${method === 'email' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Mail size={12} /> Email
              </button>
              <button 
                onClick={() => setMethod('telegram')}
                className={`flex-1 py-2.5 z-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-300 ${method === 'telegram' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Smartphone size={12} /> Telegram
              </button>
            </div>
          </div>
        ) : (
           <p className="text-zinc-500 mb-10 text-xs font-medium italic opacity-80 break-all border-b border-white/5 pb-4">{email}</p>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5 text-left animate-in fade-in slide-in-from-bottom duration-500">
            <div className="relative group">
              {method === 'email' ? (
                <>
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required 
                    placeholder="Admin Email Protocol..." 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-500/30 transition-all text-sm font-medium h-14"
                  />
                </>
              ) : (
                <>
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Linked Phone (e.g. 91...)" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-500/30 transition-all text-sm font-medium h-14"
                  />
                  <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-zinc-400 font-medium leading-relaxed">
                      Telegram Node works only if your number is connected in <span className="text-blue-400">Settings</span>. Use country code without '+'.
                    </p>
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] h-14 uppercase tracking-widest text-[11px]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Establish Neural Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between gap-2 md:gap-3">
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
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black focus:border-blue-500 outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-center text-[10px] uppercase tracking-[0.2em] font-black">
               {canResend ? (
                 <button type="button" onClick={handleSendOtp} className="text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-colors">
                   <RefreshCw size={12} /> Sync New Code
                 </button>
               ) : (
                 <span className="text-zinc-600 flex items-center gap-2">
                   <Loader2 size={10} className="animate-spin" /> Next Sync in 00:{timer < 10 ? `0${timer}` : timer}
                 </span>
               )}
            </div>

            <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] h-14 flex items-center justify-center uppercase tracking-widest text-[11px]">
              {loading ? <Loader2 className="animate-spin text-zinc-400" size={18} /> : 'Confirm Identity'}
            </button>
          </form>
        )}

        <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-center gap-4 opacity-40">
          <p className="text-[8px] uppercase tracking-[0.5em] font-black italic text-zinc-500">Encrypted OS v2.0.4</p>
        </div>
      </div>
    </div>
  );
          }
               
                                                               
