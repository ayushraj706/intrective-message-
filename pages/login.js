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
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // --- NEURAL TIMER PROTOCOL ---
  useEffect(() => {
    let interval;
    if ((step === 2 || step === 3) && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // --- OTP INPUT HELPERS ---
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

  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      setOtp(data.split(''));
      inputRefs.current[5].focus();
      toast.success("Security sequence synchronized.");
    }
  };

  // --- ACTION: SEND PRIMARY OTP (EMAIL) ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.warning("Administrative email required.");

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, type: 'login' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Verification code dispatched to email.");
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "Master node failed to send code.");
      }
    } catch (err) { toast.error("Connection Latency: API unreachable."); }
    setLoading(false);
  };

  // --- ACTION: VERIFY & AUTOMATIC 2FA TRIGGER ---
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
          type: step === 2 ? 'login' : '2fa' // Switch prefix: login_ or 2fa_
        }),
      });
      const data = await res.json();

      if (data.success) {
        // --- LOGIC: REDIRECT TO TELEGRAM 2FA ---
        if (data.require2FA && step === 2) {
          toast.info("Secondary Identity Check Required");
          setPhone(data.phoneNumber);
          setStep(3); // Moving to Telegram Step
          setOtp(['', '', '', '', '', '']);
          
          // CRITICAL: Force Telegram Node Trigger (type: '2fa')
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: cleanEmail, 
              type: '2fa', // Backend uses GramJS for this type
              targetPhone: data.phoneNumber 
            }),
          });
          setTimer(30);
          setCanResend(false);
        } 
        // --- LOGIC: FINAL REDIRECT TO DASHBOARD ---
        else if (data.token) {
          toast.success("Identity Confirmed.");
          await signInWithCustomToken(auth, data.token);
          
          localStorage.setItem('admin_email', cleanEmail);
          localStorage.setItem('basekey_session', 'authenticated');
          
          router.push('/dashboard'); // Redirection to Dashboard
        }
      } else {
        toast.error(data.error || "Sequence mismatch. Verification failed.");
      }
    } catch (err) { toast.error("Neural Bridge Breach detected."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-[#1C1E21] selection:bg-[#00A884]/20">
      
      {/* Meta Developer Style Header */}
      <div className="w-full max-w-[400px] text-center mb-8">
        <div className="flex justify-center items-center gap-2.5 mb-3">
           <div className="bg-[#00A884] p-2.5 rounded-xl text-white shadow-lg shadow-[#00A884]/20">
              <Shield size={24} fill="currentColor" />
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-[#1C1E21]">BaseKey <span className="text-[#00A884]">Developers</span></h1>
        </div>
        <p className="text-[10px] text-[#65676B] font-bold uppercase tracking-[0.2em]">Administrative Portal Node v2.0.4</p>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_28px_rgba(0,0,0,0.1)] border border-[#DDD] overflow-hidden transition-all duration-500">
        
        {/* Progress Tracker */}
        <div className="h-1 w-full bg-[#EBEDF0] flex">
           <div className={`h-full bg-[#00A884] transition-all duration-1000 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full shadow-[0_0_8px_#00A884]'}`}></div>
        </div>

        <div className="p-8">
          {step > 1 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[11px] font-bold text-[#00A884] uppercase mb-6 hover:underline transition-all">
              <ArrowLeft size={14} strokeWidth={3} /> Change Account
            </button>
          )}

          <h2 className="text-[22px] font-bold mb-2 text-[#1C1E21]">
            {step === 1 ? 'Identity' : step === 2 ? 'Verify Email' : 'Telegram 2-Step'}
          </h2>
          <p className="text-[13px] text-[#65676B] mb-8 leading-relaxed">
            {step === 1 ? 'Log in to your developer dashboard to manage neural business nodes.' : 
             step === 2 ? `A 6-digit sequence was sent to ${email}` : 
             `Final verification required via Telegram (+${phone.replace(/^\+/, '')})`} 
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B4F56] uppercase tracking-wider ml-1">Administrative Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D949E] group-focus-within:text-[#00A884] transition-colors" size={18} />
                  <input 
                    type="email" required placeholder="admin@basekey.dev" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 bg-[#F5F6F7] border border-[#DDD] rounded-lg pl-12 pr-4 outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition-all text-[15px] font-medium"
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full h-12 bg-[#00A884] hover:bg-[#008F70] text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-md active:scale-[0.98]">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="flex justify-between gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} ref={(el) => (inputRefs.current[idx] = el)} type="text" inputMode="numeric" value={digit}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    onChange={(e) => handleChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-14 bg-[#F5F6F7] border border-[#DDD] border-b-[3px] focus:border-b-[#00A884] rounded-lg text-center text-xl font-bold focus:bg-white outline-none transition-all"
                  />
                ))}
              </div>

              <div className="space-y-4">
                <button disabled={loading || otp.join('').length < 6} className="w-full h-12 bg-[#1C1E21] hover:bg-black text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-lg active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify and Authorize'}
                </button>
                
                <div className="text-center">
                   {canResend ? (
                      <button type="button" onClick={handleSendOtp} className="text-[11px] font-bold text-[#00A884] hover:underline flex items-center justify-center gap-1.5 mx-auto uppercase tracking-widest">
                        <RefreshCw size={12} /> Sync New Code
                      </button>
                   ) : (
                      <p className="text-[11px] font-bold text-[#8D949E] uppercase tracking-widest">Resend available in {timer}s</p>
                   )}
                </div>
              </div>

              {step === 3 && (
                <div className="p-4 bg-[#E7F3FF] border border-[#00A884]/20 rounded-xl flex gap-3.5 items-start animate-in slide-in-from-top duration-500">
                   <Smartphone className="text-[#00A884] shrink-0 mt-0.5" size={18} />
                   <p className="text-[11px] text-[#1C1E21] leading-relaxed font-medium">
                     <b>Verification Protocol:</b> Secure codes are routed via your <b>Master Telegram Node</b>. Check your messages to confirm this session.
                   </p>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="bg-[#F5F6F7] px-8 py-4 border-t border-[#DDD] flex justify-between items-center">
           <span className="text-[10px] font-bold text-[#90949C] uppercase tracking-wider">BaseKey Developer Auth Node</span>
           <div className="flex items-center gap-1.5 text-[#90949C]">
              <Lock size={12} />
              <span className="text-[9px] font-bold uppercase">Encrypted</span>
           </div>
        </div>
      </div>

      <div className="mt-8 flex gap-8 text-[11px] text-[#65676B] font-bold uppercase tracking-widest">
         <a href="#" className="hover:text-[#00A884] transition-colors">Documentation</a>
         <a href="#" className="hover:text-[#00A884] transition-colors">Privacy</a>
         <a href="#" className="hover:text-[#00A884] transition-colors">Security Node</a>
      </div>
    </div>
  );
            }
                
