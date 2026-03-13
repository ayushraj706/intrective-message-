import { useState, useEffect } from 'react';
import { auth } from '../firebase'; // अब ये एरर नहीं देगा
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';
import { Lock, Mail, Moon, Sun } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center p-6 transition-all">
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-6 right-6 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      >
        {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-zinc-600" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-[#121212] border border-zinc-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8 text-center">Admin Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
