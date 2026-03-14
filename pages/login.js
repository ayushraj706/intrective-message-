import { useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, ShieldCheck, Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' ya 'otp'
  const [loading, setLoading] = useState(false);

  // 1. OTP Bhejne ka function
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp'); // Email jane ke baad OTP step par jao
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Fail ho gaya bhai!");
    }
    setLoading(false);
  };

  // 2. OTP Verify karne ka function
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        // Verification success!
        router.push('/dashboard'); 
      } else {
        alert("Galat OTP: " + data.error);
      }
    } catch (error) {
      alert("Verification fail ho gaya!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-10 text-center shadow-2xl transition-all">
        
        <div className="mb-8 inline-flex p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
          <ShieldCheck size={40} className="text-blue-500" />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter italic">Base<span className="text-blue-500">Key</span> Studio</h1>
        <p className="text-gray-500 mb-10 text-sm">
          {step === 'email' ? 'Apna Authorized Email dalein' : 'Email par bheja gaya OTP dalein'}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4 text-left">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
              <input 
                type="email" 
                required
                placeholder="admin@ayus.fun"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Get Login OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 text-left">
            <input 
              type="text" 
              required
              placeholder="6-Digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-4 outline-none focus:border-blue-500 transition-all text-center text-2xl font-bold tracking-[0.5em]"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Verify & Enter Dashboard'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep('email')} 
              className="w-full text-xs text-gray-500 uppercase font-bold tracking-widest mt-2 hover:text-white"
            >
              Email Badlein
            </button>
          </form>
        )}

        <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
          Powered by Resend & Firebase
        </p>
      </div>
    </div>
  );
}
