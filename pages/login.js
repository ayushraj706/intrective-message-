import { useState } from 'react';
import { auth } from '../firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); // Login सफल होने पर डैशबोर्ड पर भेजें
    } catch (error) {
      alert("Galat Credentials! " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-4">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tighter">Admin Login</h1>
          <p className="text-gray-500 mt-2 text-sm">BaseKey Dashboard में एंट्री करें।</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-500" size={18} />
            <input 
              type="email" 
              placeholder="Email ID" 
              className="w-full bg-black border border-gray-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-500" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-black border border-gray-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Entry Now <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

