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
    // 1. Theme Loading Logic
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);

    // 2. Data Loading with Safety Check
    const loadUser = async () => {
      // Dono sources se email check karo
      const email = auth.currentUser?.email || localStorage.getItem('admin_email');
      
      if (email) {
        try {
          const docSnap = await getDoc(doc(db, "users", email));
          if (docSnap.exists()) {
            setName(docSnap.data().name || '');
            setIsPrivate(docSnap.data().isPrivate || false);
          }
        } catch (err) {
          console.error("Data fetch error:", err);
        }
      }
    };
    loadUser();
  }, []);

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

  // --- UPDATED SAVE LOGIC (Crash Proof) ---
  const handleUpdateProfile = async () => {
    setLoading(true);
    
    // Step 1: Check Karo Email Valid Hai Ya Nahi
    const email = auth.currentUser?.email || localStorage.getItem('admin_email');

    if (!email) {
      alert("Error: User identity nahi mili. Please login dubara karein.");
      setLoading(false);
      return;
    }

    try {
      // Step 2: Use setDoc with { merge: true } 
      // Ye 'update' bhi karta hai aur agar doc na ho toh 'create' bhi kar deta hai
      const userRef = doc(db, "users", email);
      
      await setDoc(userRef, {
        name: name,
        isPrivate: isPrivate,
        updatedAt: new Date(),
        email: email // Future reference ke liye email bhi save karlo
      }, { merge: true });

      alert("Badhai ho! Settings ekdum mast save ho gayi hain. 🚀");
    } catch (err) {
      console.error("Save Error:", err);
      alert("Oops! Kuch gadbad hui: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 h-screen overflow-y-auto bg-zinc-50 dark:bg-[#080808] transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <header>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">Account <span className="text-blue-500">Settings</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Manage your identity, appearance, and privacy.</p>
        </header>

        {/* PROFILE SECTION */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl transition-all">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                {name ? name.charAt(0).toUpperCase() : <User size={40}/>}
              </div>
              <button className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-white/10 shadow-lg text-blue-500 hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">Profile Identity</h3>
              <p className="text-zinc-500 text-xs">Admin dashboard par aapka avatar aur naam.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Ayush Raj"
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm dark:text-white focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
        </section>

        {/* APPEARANCE SECTION */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><Sun size={20} className="text-blue-500" /> Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThemeCard active={theme === 'light'} onClick={() => handleThemeChange('light')} icon={<Sun size={20}/>} label="Light" />
            <ThemeCard active={theme === 'dark'} onClick={() => handleThemeChange('dark')} icon={<Moon size={20}/>} label="Dark" />
            <ThemeCard active={theme === 'system'} onClick={() => handleThemeChange('system')} icon={<Monitor size={20}/>} label="System" />
          </div>
        </section>

        {/* PRIVACY SECTION */}
        <section className="bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl">
          <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><Shield size={20} className="text-green-500" /> Security & Privacy</h3>
          <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-100 dark:border-white/5">
            <div>
              <p className="font-bold text-sm dark:text-white">Private Mode</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Restrict specific admin modules</p>
            </div>
            <div 
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPrivate ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : ''}`}></div>
            </div>
          </div>
        </section>

        <button 
          onClick={handleUpdateProfile} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {loading ? 'Processing...' : 'Apply All Changes'}
        </button>

        <footer className="text-center pt-10 border-t border-zinc-200 dark:border-white/5">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.5em]">
            BaseKey System v1.0.4 • Created by Ayush Raj
          </p>
        </footer>
      </div>
    </div>
  );
};

const ThemeCard = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
      active 
        ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' 
        : 'bg-zinc-50 dark:bg-black border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-blue-500/50'
    }`}
  >
    {icon}
    <span className="font-bold text-sm">{label}</span>
  </button>
);

export default AccountSettings;
          
