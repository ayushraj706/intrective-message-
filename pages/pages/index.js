import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Moon, Sun } from 'lucide-react';

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white flex items-center justify-center transition-all">
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-6 right-6 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
      >
        {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
      </button>

      <div className="text-center p-8 max-w-lg">
        <div className="mb-6 inline-flex p-4 bg-green-500/10 rounded-3xl border border-green-500/20">
          <ShieldCheck size={48} className="text-green-500" />
        </div>

        <h1 className="text-5xl font-extrabold mb-4 tracking-tighter">
          Base<span className="text-green-500">Key</span> AI
        </h1>
        
        <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8">
            WhatsApp Business Automation aur AI Solutions ka official portal.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full mb-10">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">System Online: v1.0.0</span>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/login" className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all">
              Enter Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

