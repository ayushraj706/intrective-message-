import React, { useState, useEffect } from 'react';
import { LogOut, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfile = () => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: 'Admin', email: '' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const activeEmail = user?.email || localStorage.getItem('admin_email');
      
      if (activeEmail) {
        setUserData(prev => ({ ...prev, email: activeEmail }));
        try {
          const docSnap = await getDoc(doc(db, "users", activeEmail));
          if (docSnap.exists() && docSnap.data().name) {
            setUserData({ name: docSnap.data().name, email: activeEmail });
          } else {
            const namePart = activeEmail.split('@')[0];
            setUserData({ name: namePart.charAt(0).toUpperCase() + namePart.slice(1), email: activeEmail });
          }
        } catch (err) { console.log(err); }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error) { alert("Logout fail!"); }
  };

  return (
    <div className="mt-auto relative">
      {showProfileMenu && (
        <div className="absolute bottom-[110%] left-0 right-0 mb-2 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 z-[100] backdrop-blur-xl">
          <div className="p-3 border-b border-zinc-100 dark:border-white/5 mb-1 text-left">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.email || "Identifying..."}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all border ${showProfileMenu ? 'bg-zinc-100 dark:bg-[#27292d] border-white/5' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-[#1d1f23]'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
          {userData.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.name}</span>
            <span className="text-[10px] text-zinc-500 font-medium">BaseKey Admin</span>
        </div>
        <ChevronUp size={14} className={`ml-auto text-zinc-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default UserProfile;
