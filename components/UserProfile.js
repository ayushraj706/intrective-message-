import React, { useState, useEffect } from 'react';
import { LogOut, ChevronUp, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfile = () => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: 'Admin', email: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      const localEmail = localStorage.getItem('admin_email');
      
      if (user || localEmail) {
        const email = user?.email || localEmail;
        setUserData(prev => ({ ...prev, email }));

        try {
          const docSnap = await getDoc(doc(db, "users", email));
          if (docSnap.exists() && docSnap.data().name) {
            setUserData(prev => ({ ...prev, name: docSnap.data().name }));
          } else {
            const nameFromEmail = email.split('@')[0];
            setUserData(prev => ({ 
              ...prev, 
              name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) 
            }));
          }
        } catch (err) {
          console.log("Profile fetch error:", err);
        }
      }
    };
    fetchUserData();
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
      {/* Popover Menu */}
      {showProfileMenu && (
        <div className="absolute bottom-[105%] left-0 right-0 mb-2 bg-white dark:bg-[#212327] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="p-3 border-b border-zinc-100 dark:border-white/5 mb-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button 
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all border ${showProfileMenu ? 'bg-zinc-100 dark:bg-[#27292d] border-white/5' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-[#1d1f23]'}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
          {userData.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.name}</span>
            <span className="text-[10px] text-zinc-500 dark:text-gray-500">BaseKey Admin</span>
        </div>
        <ChevronUp size={14} className={`ml-auto text-zinc-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default UserProfile;
          
