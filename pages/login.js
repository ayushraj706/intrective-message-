import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase'; // Aapka firebase config file
import { signInWithCustomToken } from 'firebase/auth';
import { ShieldCheck, Loader2, Mail, KeyRound, ArrowLeft, Fingerprint } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

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
      
      if (data.success && data.token) {
        // --- YE LINE SAB THEEK KAR DEGI ---
        // Firebase mein officially login ho rahe hain
        await signInWithCustomToken(auth, data.token);
        
        localStorage.setItem('basekey_session', 'authenticated');
        router.push('/dashboard');
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (err) { 
        console.error(err);
        alert("Error: " + err.message); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-white font-sans overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[400px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-all"><ArrowLeft size={20} /></button>
        )}
        
        <div className="mb-8 inline-flex p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          {step === 1 ? <ShieldCheck size={35} /> : <Fingerprint size={35} className="animate-pulse" />}
        </div>
        
        <h1 className="text-4xl font-black mb-1 tracking-tight italic uppercase">Base<span className="text-blue-500">Key</span></h1>
        <p className="text-zinc-500 mb-10 text-[9px] uppercase tracking-[0.4em] font-bold">Secure Admin Neural Link</p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="email" required placeholder="Admin Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Request Access'}
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
                  className="w-full h-14 bg-zinc-900/50 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-blue-500 outline-none transition-all"
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Identity'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-white/5 opacity-40">
          <p className="text-[8px] uppercase tracking-[0.5em] font-black">System Layer 1.0.4 • Ayush Raj</p>
        </div>
      </div>
    </div>
  );
                }
