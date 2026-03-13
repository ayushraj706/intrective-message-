import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/router';
import { LogIn } from 'lucide-react';

export default function Login() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Firebase browser mein apne aap session save kar lega (Persistence)
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login Error:", error.message);
      alert("Login fail ho gaya: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-10 text-center shadow-2xl">
        <div className="mb-8 inline-flex p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter">Base<span className="text-blue-500">Key</span> AI</h1>
        <p className="text-gray-500 mb-10 text-sm">Sirf Authorized Admin hi entry kar sakte hain.</p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-lg"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
          Sign in with Google
        </button>

        <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest">Secure Admin Access Only</p>
      </div>
    </div>
  );
}

