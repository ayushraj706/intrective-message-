import React, { useState, useEffect } from 'react';
import { LogOut, ChevronUp, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfile = () => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: 'Loading...', email: '' });

  useEffect(() => {
    // 1. Firebase Auth Listener (Ye turant detect karega jab user login hoga)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userEmail = user.email || localStorage.getItem('admin_email');
        
        // Default set karo pehle (Email ka pehla part naam bana do)
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'Admin';
        setUserData({ 
          name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1), 
          email: userEmail 
        });

        // 2. Firestore se real name uthao agar exist karta hai
        if (userEmail) {
          try {
            const docSnap = await getDoc(doc(db, "users", userEmail));
            if (docSnap.exists() && docSnap.data().name) {
              setUserData({ 
                name: docSnap.data().name, 
                email: userEmail 
              });
            }
          } catch (err) {
            console.error("Firestore error:", err);
          }
        }
      } else {
        // Agar session nahi hai toh localStorage se check karo
        const localEmail = localStorage.getItem('admin_email');
        if (localEmail) {
           setUserData({ name: localEmail.split('@')[0], email: localEmail });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error) {
      alert("Logout fail hua!");
    }
  };

  return (
    <div className="mt-auto relative">
      {/* Popover Menu (Upward) */}
      {showProfileMenu && (
        <div className="absolute bottom-[110%] left-0 right-0 mb-2 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100] backdrop-blur-xl">
          <div className="p-3 border-b border-zinc-100 dark:border-white/5 mb-1 text-left">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Signed in as</p>
            {/* Yahan email ab pakka dikhega */}
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
              {userData.email || 'No Email Found'}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      {/* Profile Trigger Button */}
      <button 
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all border ${showProfileMenu ? 'bg-zinc-100 dark:bg-[#27292d] border-white/5' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-[#1d1f23]'}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
          {userData.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.name}</span>
            <span className="text-[10px] text-zinc-500 dark:text-gray-500 font-medium">BaseKey Admin</span>
        </div>
        <ChevronUp size={14} className={`ml-auto text-zinc-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default UserProfile;
