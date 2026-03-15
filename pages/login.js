import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck, Loader2, Mail, KeyRound, ArrowLeft, Zap, Fingerprint } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // OTP boxes logic
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
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
      if (data.success) {
        // --- YE LINE DASHBOARD KA LOCK KHOL DEGI ---
        localStorage.setItem('basekey_session', 'authenticated');
        localStorage.setItem('admin_email', email);
        router.push('/dashboard');
      } else {
        alert(data.error || "Galat OTP!");
      }
    } catch (err) { alert("Verification failed!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-white font-sans selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 text-center shadow-2xl relative z-10">
        
        {step === 2 && (
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div className="mb-8 inline-flex p-4 bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl border border-blue-500/20 text-blue-500">
          {step === 1 ? <ShieldCheck size={38} /> : <Fingerprint size={38} className="animate-pulse" />}
        </div>
        
        <h1 className="text-4xl font-black mb-1 tracking-tighter italic">Base<span className="text-blue-500">Key</span></h1>
        <p className="text-zinc-500 mb-10 text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
          {step === 1 ? 'Neural Access Gateway' : 'Identity Verification'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="email" required placeholder="Admin Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Request Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text" maxLength={1} value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 bg-zinc-900/50 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Authorize Access'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[9px] text-zinc-800 uppercase tracking-[0.4em] font-black">Ayush Raj • System 1.0.4</p>
        </div>
      </div>
    </div>
  );
}
