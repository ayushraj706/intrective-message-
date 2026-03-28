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
  const [step, setStep] = useState(1); // 1: Email, 2: Email OTP, 3: Telegram OTP
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // OTP Timer Logic
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

  // --- STEP 1: SEND EMAIL OTP ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.warning("Admin Email required!");

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, type: 'login' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security code sent to email.");
        setStep(2);
        setTimer(30);
        setCanResend(false);
      } else {
        toast.error(data.error || "Failed to send code.");
      }
    } catch (err) { toast.error("System connection failed."); }
    setLoading(false);
  };

  // --- STEP 2 & 3: VERIFY & REDIRECT ---
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
          type: step === 2 ? 'login' : '2fa' // Backend prefix switcher
        }),
      });
      const data = await res.json();

      if (data.success) {
        // NEURAL SWITCH: Agar 2FA on hai toh step 3 par bhej do
        if (data.require2FA && step === 2) {
          toast.info("Secondary Verification Required");
          setPhone(data.phoneNumber);
          setStep(3); // Step 3 trigger
          setOtp(['', '', '', '', '', '']);
          // Auto-trigger Telegram OTP from Master Node
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, type: '2fa', targetPhone: data.phoneNumber }),
          });
          setTimer(30);
        } 
        // FINAL SUCCESS: Dashboard Redirection
        else if (data.token) {
          toast.success("Identity Verified!");
          await signInWithCustomToken(auth, data.token);
          
          localStorage.setItem('admin_email', cleanEmail);
          localStorage.setItem('basekey_session', 'authenticated');
          
          router.push('/dashboard'); // <--- YE HAI DASHBOARD ENTER KARNE KA LOGIC
        }
      } else {
        toast.error(data.error || "Invalid Security Code.");
      }
    } catch (err) { toast.error("Verification Breach Detected."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-[#1C1E21]">
      
      {/* Meta Style Header */}
      <div className="w-full max-w-[400px] text-center mb-6">
        <div className="flex justify-center items-center gap-2 mb-3">
           <div className="bg-[#00A884] p-2 rounded-lg text-white">
              <Shield size={24} />
           </div>
           <h1 className="text-xl font-bold tracking-tight text-[#1C1E21]">BaseKey <span className="text-[#00A884]">Developers</span></h1>
        </div>
        <p className="text-[10px] text-[#606770] font-bold uppercase tracking-widest">Master Node v2.0.4</p>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] border border-[#DDD] overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-[#EBEDF0]">
           <div className={`h-full bg-[#00A884] transition-all duration-700 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        <div className="p-8">
          {step > 1 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[10px] font-bold text-[#00A884] uppercase mb-4 hover:underline">
              <ArrowLeft size={12} /> Change Account
            </button>
          )}

          <h2 className="text-xl font-bold mb-2">
            {step === 1 ? 'Identity' : step === 2 ? 'Verify Email' : 'Telegram 2FA'}
          </h2>
          <p className="text-xs text-[#606770] mb-8 leading-relaxed">
            {step === 1 ? 'Enter your work email to access the administrative portal.' : 
             step === 2 ? `Enter the 6-digit code sent to ${email}` : 
             `A security code was sent to your Telegram (+${phone})`}
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#4B4F56] uppercase tracking-wider ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D949E]" size={16} />
                  <input 
                    type="email" required placeholder="admin@basekey.fun" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 bg-[#F5F6F7] border border-[#DDD] rounded-lg pl-11 pr-4 outline-none focus:border-[#00A884] transition-all text-sm"
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full h-11 bg-[#00A884] hover:bg-[#008F70] text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-sm">
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} ref={(el) => (inputRefs.current[idx] = el)} type="text" inputMode="numeric" value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-12 bg-[#F5F6F7] border-b-2 border-[#DDD] text-center text-lg font-bold focus:border-[#00A884] outline-none transition-all"
                  />
                ))}
              </div>

              <div className="space-y-4">
                <button disabled={loading || otp.join('').length < 6} className="w-full h-11 bg-[#1C1E21] hover:bg-black text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-md">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Access'}
                </button>
                
                <div className="text-center">
                   {canResend ? (
                      <button type="button" onClick={handleSendOtp} className="text-[10px] font-bold text-[#00A884] hover:underline flex items-center justify-center gap-1 mx-auto uppercase tracking-widest">
                        <RefreshCw size={10} /> Sync New Code
                      </button>
                   ) : (
                      <p className="text-[10px] font-bold text-[#90949C] uppercase tracking-widest">Sync available in {timer}s</p>
                   )}
                </div>
              </div>

              {step === 3 && (
                <div className="p-4 bg-[#E7F3FF] border border-[#00A884]/20 rounded-lg flex gap-3">
                   <Smartphone className="text-[#00A884] shrink-0" size={16} />
                   <p className="text-[10px] text-[#1C1E21] leading-relaxed">
                     <b>Telegram Active:</b> Secure codes are sent via your master node. Check your Telegram messages to continue.
                   </p>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="bg-[#F5F6F7] px-8 py-4 border-t border-[#DDD] flex justify-between items-center text-[9px] font-bold text-[#90949C] uppercase tracking-wider">
           <span>BaseKey Node</span>
           <Lock size={12} className="text-[#BEC3C9]" />
        </div>
      </div>
    </div>
  );
            }
                      
