import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck, Loader2, Mail, KeyRound, ArrowLeft, Zap } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // OTP focus logic
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setStep(2);
      else alert(data.error);
    } catch (err) { alert("Server error!"); }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const finalOtp = otp.join('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: finalOtp }),
      });
      const data = await res.json();
      if (data.success) router.push('/dashboard');
      else alert(data.error);
    } catch (err) { alert("Verification failed!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-white font-sans selection:bg-blue-500/30">
      {/* Background Animated Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 text-center shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)] relative z-10">
        
        {step === 2 && (
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-gray-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-5 bg-gradient-to-br from-blue-500/20 to-transparent rounded-3xl border border-blue-500/30 text-blue-500 shadow-inner">
            {step === 1 ? <ShieldCheck size={42} strokeWidth={1.5} /> : <Zap size={42} className="fill-blue-500/20" />}
          </div>
        </div>
        
        <h1 className="text-5xl font-black mb-2 tracking-tightest italic leading-none">
          Base<span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Key</span>
        </h1>
        <p className="text-gray-500 mb-12 text-xs uppercase tracking-[0.4em] font-semibold opacity-70">
          {step === 1 ? 'Neural Admin Gateway' : 'Identity Verification'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="group relative">
              <Mail className="absolute left-5 top-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="email" required placeholder="Enter Admin Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium placeholder:text-gray-700"
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)]"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Request Access Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-16 bg-black/60 border border-white/10 rounded-2xl text-center text-2xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              ))}
            </div>
            <button 
              type="submit" disabled={loading || otp.join('').length < 6}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-500 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] transition-all disabled:opacity-30 disabled:grayscale"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Authorize Identity'}
            </button>
            <p className="text-[10px] text-gray-500 font-medium">
              Didn't receive code? <span className="text-blue-500 cursor-pointer hover:underline" onClick={handleSendOtp}>Resend to {email}</span>
            </p>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[9px] text-gray-800 uppercase tracking-[0.5em] font-black">
            Ayush Raj • System Layer 1.0.4
          </p>
        </div>
      </div>
    </div>
  );
                    }
