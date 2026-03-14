import { useState } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck, Loader2, Lock, Mail } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (data.success) {
        // Success! Dashboard par bhejo
        router.push('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Kuch gadbad hui!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-10 text-center shadow-2xl">
        
        <div className="mb-8 inline-flex p-4 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-500">
          <ShieldCheck size={40} />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter italic">Base<span className="text-blue-500">Key</span> AI</h1>
        <p className="text-gray-500 mb-10 text-sm italic">Admin Control Panel Access</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-600" size={18} />
            <input 
              type="email" required placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-600" size={18} />
            <input 
              type="password" required placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-blue-500/5"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Log In as Admin'}
          </button>
        </form>

        <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
          Ayush Raj • Restricted Access
        </p>
      </div>
    </div>
  );
                }
                
