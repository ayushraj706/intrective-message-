import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Users, BarChart3, LayoutDashboard, 
  Settings, ChevronDown, Bot, Zap, LogOut, ChevronUp 
} from 'lucide-react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Sidebar = ({ setActiveTab, activeTab }) => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({ name: 'Admin', email: '' });

  // 1. Dynamic User Data Fetching
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
            // Email se naam extract karna (e.g. ayushraj@gmail.com -> Ayushraj)
            const nameFromEmail = email.split('@')[0];
            setUserData(prev => ({ ...prev, name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) }));
          }
        } catch (err) {
          console.log("Profile fetch error:", err);
        }
      }
    };
    fetchUserData();
  }, []);

  // 2. Logout Logic
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
    <div className="w-64 h-screen bg-white dark:bg-[#1a1c1e] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200 dark:border-gray-800 shadow-xl transition-colors duration-300">
      
      {/* Brand Logo */}
      <div className="p-5 flex items-center gap-3 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-gray-800/50">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 text-white">A</div>
        <span className="font-bold tracking-tight text-lg uppercase italic">Base<span className="text-blue-600">Key</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold mb-3 block px-3">Main</label>
        
        <NavItem icon={<MessageSquare size={19}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        <NavItem icon={<Users size={19}/>} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
        <NavItem icon={<Zap size={19}/>} label="Interactive Flow" active={activeTab === 'flow'} onClick={() => setActiveTab('flow')} />
        <NavItem icon={<Bot size={19}/>} label="AI Integration" active={activeTab === 'integration'} onClick={() => setActiveTab('integration')} />
        <NavItem icon={<BarChart3 size={19}/>} label="Reports" />

        <div className="mt-8 mb-3 px-3 flex justify-between items-center">
           <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold">Settings</label>
           <ChevronDown size={12} className="text-zinc-400 dark:text-zinc-600" />
        </div>
        
        {/* Yahan Inboxes ko Dashboard kar diya gaya hai */}
        <NavItem icon={<LayoutDashboard size={19}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Settings size={19}/>} label="Account Settings" />
      </nav>

      {/* --- DYNAMIC PROFILE SECTION --- */}
      <div className="p-4 border-t border-zinc-100 dark:border-gray-800 relative">
        
        {/* Upward Popover Menu */}
        {showProfileMenu && (
          <div className="absolute bottom-[100%] left-4 right-4 mb-2 bg-white dark:bg-[#212327] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
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

        {/* Profile Trigger Button */}
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all ${showProfileMenu ? 'bg-zinc-100 dark:bg-[#27292d]' : 'hover:bg-zinc-50 dark:hover:bg-[#1d1f23]'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.name}</span>
              <span className="text-[10px] text-zinc-500 dark:text-gray-500">BaseKey Admin</span>
          </div>
          <ChevronUp size={14} className={`ml-auto text-zinc-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 
      ${active 
        ? 'bg-zinc-100 dark:bg-[#27292d] text-blue-600 dark:text-white shadow-sm border border-zinc-200 dark:border-white/5' 
        : 'text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#212327] hover:text-zinc-900 dark:hover:text-gray-200'
      }`}
  >
    <span className={active ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-400 dark:text-gray-500'}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default Sidebar;
          
