import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Loader2, Globe, ShieldAlert, KeyRound, MessageSquareCode } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { toast } from 'sonner';
import axios from 'axios';

const TelegramAPISetup = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Credentials, Step 2: OTP
  
  const [formData, setFormData] = useState({
    apiId: '',
    apiHash: '',
    phoneNumber: ''
  });
  
  const [otp, setOtp] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [tempSession, setTempSession] = useState('');
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "configs", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().telegramApiId) {
          setFormData({
            apiId: docSnap.data().telegramApiId || '',
            apiHash: docSnap.data().telegramApiHash || '',
            phoneNumber: docSnap.data().telegramPhone || ''
          });
          // Agar pehle se verified hai toh step 3 ya success dikha sakte hain
          if (docSnap.data().telegramSession) {
             setStep(3);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- STEP 1: SEND OTP ---
  const handleSendCode = async () => {
    if (!uid) return toast.error("System busy!");
    if (!formData.apiId || !formData.apiHash || !formData.phoneNumber) {
      return toast.warning("API ID, Hash aur Phone Number zaroori hai!");
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/telegram-auth', {
        action: 'sendCode',
        apiId: parseInt(formData.apiId),
        apiHash: formData.apiHash,
        phoneNumber: formData.phoneNumber
      });

      if (res.data.success) {
        setPhoneCodeHash(res.data.phoneCodeHash);
        setTempSession(res.data.tempSession); // Vercel connection maintain karne ke liye
        setStep(2);
        toast.success("OTP Bhej diya gaya hai!", { description: "Apne Telegram app mein check karein." });
      } else {
        toast.error("Failed to send code", { description: res.data.error });
      }
    } catch (err) {
      toast.error("API Error", { description: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async () => {
    if (!otp) return toast.warning("OTP daalein!");
    setLoading(true);

    try {
      const res = await axios.post('/api/telegram-auth', {
        action: 'verifyCode',
        apiId: parseInt(formData.apiId),
        apiHash: formData.apiHash,
        phoneNumber: formData.phoneNumber,
        phoneCodeHash: phoneCodeHash,
        otp: otp,
        tempSession: tempSession
      });

      if (res.data.success) {
        // Firebase mein Session String save karo
        await setDoc(doc(db, "configs", uid), {
          telegramApiId: formData.apiId,
          telegramApiHash: formData.apiHash,
          telegramPhone: formData.phoneNumber,
          telegramSession: res.data.sessionString, // Ye sabse main cheez hai!
          updatedAt: new Date(),
          userId: uid
        }, { merge: true });

        setStep(3);
        toast.success("Identity Verified!", { description: "Telegram MTProto Linked Successfully." });
      } else {
        toast.error("Invalid OTP", { description: res.data.error });
      }
    } catch (err) {
      toast.error("Verification Error", { description: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-zinc-50 dark:bg-[#080808] h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-8 text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        <h2 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white tracking-tighter italic">
          Telegram <span className="text-blue-500">Client API</span>
        </h2>
        <p className="text-zinc-500 mb-10 text-sm font-medium">Automate your personal Telegram account via MTProto.</p>

        <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] border border-zinc-200 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

          {step === 1 && (
            <div className="relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20">
                 <Globe className="text-blue-500 shrink-0" size={36} />
                 <div>
                    <p className="text-sm text-zinc-900 dark:text-white font-bold">MTProto Core Setup</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold mt-1">my.telegram.org Credentials</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">App API_ID</label>
                   <input 
                     type="text" value={formData.apiId} placeholder="e.g. 30306970" 
                     className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
                     onChange={(e) => setFormData({...formData, apiId: e.target.value})} 
                   />
                </div>
                <div className="space-y-4">
                   <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">App API_HASH</label>
                   <input 
                     type="password" value={formData.apiHash} placeholder="bcb54cc5be..." 
                     className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
                     onChange={(e) => setFormData({...formData, apiHash: e.target.value})} 
                   />
                </div>
              </div>

              <div className="space-y-4">
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Phone Number (With Country Code)</label>
                 <input 
                   type="text" value={formData.phoneNumber} placeholder="+919876543210" 
                   className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono text-sm" 
                   onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                 />
              </div>

              <button onClick={handleSendCode} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <MessageSquareCode size={20} />}
                {loading ? 'Connecting to Meta...' : 'Request Telegram OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="relative z-10 space-y-8 animate-in slide-in-from-right-8 duration-500 text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                 <KeyRound size={40} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Verify Your Identity</h3>
              <p className="text-sm text-zinc-500 font-medium">Telegram ne aapke official app par ek OTP bheja hai. Neeche daalein.</p>

              <div className="space-y-4 text-left pt-4">
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">Telegram Login Code</label>
                 <input 
                   type="text" value={otp} placeholder="Enter 5-digit code" maxLength="5"
                   className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 text-center text-2xl tracking-[0.5em] text-zinc-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-mono" 
                   onChange={(e) => setOtp(e.target.value)} 
                 />
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 5} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/20 active:scale-95 mt-4">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Verifying Neural Code...' : 'Verify & Generate Session'}
              </button>
              
              <button onClick={() => setStep(1)} className="text-[10px] uppercase font-bold text-zinc-400 hover:text-blue-500 tracking-widest mt-4">
                Change Phone Number
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="relative z-10 space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                 <ShieldAlert size={48} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-green-500 uppercase tracking-tighter">Connection Active</h3>
              <p className="text-sm text-zinc-400 font-medium pb-6">Aapka Telegram API Session safely secure kar liya gaya hai. Ab aap messages bhej sakte hain.</p>
              
              <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 break-all">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Encrypted Session String (Hidden)</p>
                <p className="text-xs text-blue-400 font-mono blur-sm hover:blur-none transition-all cursor-pointer">
                  1Aazk2... (Click to reveal)
                </p>
              </div>

              <button onClick={onBack} className="w-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-black py-4 rounded-[1.8rem] transition-all">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramAPISetup;
                       
