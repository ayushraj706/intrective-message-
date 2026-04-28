import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, ChevronUp, User, Shield, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfile = ({ isCollapsed }) => {
  const router = useRouter();
  const menuRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: 'Admin', email: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            setUserData({ 
              name: namePart.charAt(0).toUpperCase() + namePart.slice(1), 
              email: activeEmail 
            });
          }
        } catch (err) { 
          console.error('User data fetch error:', err); 
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error) { 
      console.error('Logout error:', error);
      alert("Logout failed. Please try again."); 
    }
  }, [router]);

  const toggleMenu = useCallback(() => {
    setShowProfileMenu(prev => !prev);
  }, []);

  const avatarGradient = React.useMemo(() => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
    ];
    const index = userData.name.charCodeAt(0) % gradients.length;
    return gradients[index];
  }, [userData.name]);

  const avatarInitial = userData.name.charAt(0).toUpperCase();

  return (
    <div className="mt-auto relative" ref={menuRef}>
      {/* Profile Dropdown Menu */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            initial={{ opacity: 0, y: isCollapsed ? 10 : 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCollapsed ? 10 : 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`absolute z-[999] bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden
              ${isCollapsed 
                ? 'left-[110%] bottom-0 w-60' 
                : 'bottom-[115%] left-0 right-0'
              }`}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg`}>
                  {avatarInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{userData.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{userData.email || "No email"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1. items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  <Shield size={9} />
                  Admin
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              <MenuItem icon={<User size={14} />} label="Profile" />
              <MenuItem icon={<Settings size={14} />} label="Preferences" />
              
              <div className="my-1.5 border-t border-zinc-100 dark:border-white/5" />
              
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors duration-200"
              >
                <LogOut size={14} />
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Profile Button */}
      <motion.button
        onClick={toggleMenu}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center rounded-2xl transition-all duration-200 border outline-none relative
          ${isCollapsed ? 'justify-center p-2' : 'p-2.5 gap-3'} 
          ${showProfileMenu 
            ? 'bg-zinc-100 dark:bg-[#27292d] border-zinc-200 dark:border-white/10 shadow-inner' 
            : 'border-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.03] hover:shadow-sm'
          }`}
      >
        {/* Avatar */}
        <div className="relative">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg ring-2 ring-white dark:ring-white/10`}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              avatarInitial
            )}
          </motion.div>
          {/* Online Status Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f1115] shadow-sm" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex flex-col text-left overflow-hidden flex-1 min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {isLoading ? 'Loading...' : userData.name}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                BaseKey Admin
              </span>
            </div>
            <motion.div
              animate={{ rotate: showProfileMenu ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronUp size={14} className="text-zinc-400 shrink-0" />
            </motion.div>
          </>
        )}
      </motion.button>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.98 }}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors duration-200"
  >
    <span className="text-zinc-400">{icon}</span>
    {label}
  </motion.button>
);

export default UserProfile;
