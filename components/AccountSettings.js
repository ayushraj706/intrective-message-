import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, Monitor, Shield, Camera, Save, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AccountSettings = () => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('system');
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);

    const loadUser = async () => {
      const email = auth.currentUser?.email || localStorage.getItem('admin_email');
      if (email) {
        try {
          const docSnap = await getDoc(doc(db, "users", email));
          if (docSnap.exists()) {
            setName(docSnap.data().name || '');
            setIsPrivate(docSnap.data().isPrivate || false);
          }
        } catch (err) { console.log(err); }
      }
    };
    loadUser();
  }, []);

  // --- UPDATED THEME LOGIC ---
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else if (newTheme === 'light') {
      html.classList.remove('dark');
    } else if (newTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const email = auth.currentUser?.email || localStorage.getItem('admin_email');

    if (!email) {
      alert("Error: User identity nahi mili. Dubara login karein.");
      setLoading(false);
      return;
    }

    try {
      await setDoc(doc(db, "users", email), {
        name,
        isPrivate,
        updatedAt: new Date(),
        email
      }, { merge: true });
      alert("Settings saved successfully! 🚀");
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 h-screen overflow-y-auto bg-zinc-50 dark:bg-[#080808] transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-10">
        <header>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">Account <span className="text-blue-500">Settings</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Personalize your admin identity and dashboard behavior.</p>
        </header>

        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-6 mb-8 text-left">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shrink-0">
                {name ? name.charAt(0).toUpperCase() : <User size={40}/>}
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">Profile Identity</h3>
              <p className="text-zinc-500 text-xs font-medium">Public name and admin avatar identification.</p>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm dark:text-white focus:border-blue-500/50 outline-none transition-all" />
          </div>
        </section>

        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl text-left">
          <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><Sun size={20} className="text-blue-500" /> Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThemeCard active={theme === 'light'} onClick={() => handleThemeChange('light')} icon={<Sun size={20}/>} label="Light" />
            <ThemeCard active={theme === 'dark'} onClick={() => handleThemeChange('dark')} icon={<Moon size={20}/>} label="Dark" />
            <ThemeCard active={theme === 'system'} onClick={() => handleThemeChange('system')} icon={<Monitor size={20}/>} label="System" />
          </div>
        </section>

        <button onClick={handleUpdateProfile} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {loading ? 'Processing...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

const ThemeCard = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-4 p-5 rounded-2xl border transition-all ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 'bg-zinc-50 dark:bg-black border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-blue-500/50'}`}>
    {icon} <span className="font-bold text-sm">{label}</span>
  </button>
);

export default AccountSettings;
  
  
