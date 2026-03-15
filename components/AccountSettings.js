import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, Monitor, Shield, Camera, Save, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const AccountSettings = () => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('system');
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    // 1. Load Theme from LocalStorage
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);

    // 2. Load User Data from Firestore
    const loadUser = async () => {
      const email = auth.currentUser?.email || localStorage.getItem('admin_email');
      if (email) {
        const docSnap = await getDoc(doc(db, "users", email));
        if (docSnap.exists()) {
          setName(docSnap.data().name || '');
          setIsPrivate(docSnap.data().isPrivate || false);
        }
      }
    };
    loadUser();
  }, []);

  // Theme Switching Logic
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const html = document.documentElement;
    
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  // Profile Update Logic
  const handleUpdateProfile = async () => {
    setLoading(true);
    const email = auth.currentUser?.email || localStorage.getItem('admin_email');
    try {
      await updateDoc(doc(db, "users", email), {
        name: name,
        isPrivate: isPrivate,
        updatedAt: new Date()
      });
      alert("Profile Update Ho Gayi!");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 h-screen overflow-y-auto bg-zinc-50 dark:bg-[#080808] transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <header>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white italic">Account <span className="text-blue-500">Settings</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Manage your identity, appearance, and privacy.</p>
        </header>

        {/* --- PROFILE SECTION --- */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                {name ? name.charAt(0).toUpperCase() : 'A'}
              </div>
              <button className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-white/10 shadow-lg text-blue-500 hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">Profile Identity</h3>
              <p className="text-zinc-500 text-xs">Aapka avatar aur public naam.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Display Name</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm dark:text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </section>

        {/* --- APPEARANCE SECTION --- */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><Sun size={20} className="text-orange-500" /> Appearance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThemeCard active={theme === 'light'} onClick={() => handleThemeChange('light')} icon={<Sun />} label="Light" />
            <ThemeCard active={theme === 'dark'} onClick={() => handleThemeChange('dark')} icon={<Moon />} label="Dark" />
            <ThemeCard active={theme === 'system'} onClick={() => handleThemeChange('system')} icon={<Monitor />} label="System" />
          </div>
        </section>

        {/* --- PRIVACY SECTION --- */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><Shield size={20} className="text-green-500" /> Security & Privacy</h3>
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-100 dark:border-white/5">
            <div>
              <p className="font-bold text-sm dark:text-white">Private Account</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Restrict access to specific modules</p>
            </div>
            <input 
              type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-6 h-6 accent-blue-600 rounded-lg" 
            />
          </div>
        </section>

        <button 
          onClick={handleUpdateProfile} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {loading ? 'Saving Changes...' : 'Save All Settings'}
        </button>

        <p className="text-center text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em] pt-10 border-t border-zinc-200 dark:border-white/5">
          BaseKey System v1.0.4 • Samastipur HQ
        </p>
      </div>
    </div>
  );
};

const ThemeCard = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-zinc-50 dark:bg-black border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-blue-500/50'}`}
  >
    {icon}
    <span className="font-bold text-sm">{label}</span>
  </button>
);

export default AccountSettings;
                
