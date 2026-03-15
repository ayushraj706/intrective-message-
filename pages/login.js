import { useState } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck, Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 for Email, 2 for OTP
  const [loading, setLoading] = useState(false);

  // Step 1: OTP Bhejna
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
      if (data.success) {
        setStep(2); // Agle step par bhejo
      } else {
        alert(data.error || "OTP bhejne mein dikkat aayi");
      }
    } catch (err) {
      alert("Server error!");
    }
    setLoading(false);
  };

  // Step 2: OTP Verify Karna
  const handleVerifyOtp = async (e) => {
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
        router.push('/dashboard');
      } else {
        alert(data.error || "Galat OTP!");
      }
    } catch (err) {
      alert("Verification failed!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full"></div>

        {/* Back Button for Step 2 */}
        {step === 2 && (
          <button 
            onClick={() => setStep(1)} 
            className="absolute top-6 left-6 text-gray-500 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div className="mb-8 inline-flex p-4 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-500">
          {step === 1 ? <ShieldCheck size={40} /> : <KeyRound size={40} className="animate-pulse" />}
        </div>
        
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter italic">Base<span className="text-blue-500">Key</span> AI</h1>
        <p className="text-gray-500 mb-10 text-sm italic">
          {step === 1 ? 'Admin Control Panel Access' : `OTP sent to ${email}`}
        </p>

        {step === 1 ? (
          /* EMAIL FORM */
          <form onSubmit={handleSendOtp} className="space-y-4 text-left">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-600" size={18} />
              <input 
                type="email" required placeholder="Admin Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          /* OTP FORM */
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
            <div className="relative">
              <KeyRound className="absolute left-4 top-4 text-gray-600" size={18} />
              <input 
                type="text" required placeholder="6-Digit OTP" value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-center text-xl tracking-[0.5em] font-bold"
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
            </button>
            <p className="text-center text-xs text-gray-600 mt-4 cursor-pointer hover:text-gray-400" onClick={handleSendOtp}>
              Didn't get the code? <span className="text-blue-500">Resend</span>
            </p>
          </form>
        )}

        <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
          Ayush Raj • Restricted Access
        </p>
      </div>
    </div>
  );
                  }
