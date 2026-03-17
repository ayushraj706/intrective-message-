import React from 'react';
import { 
  MessageSquare, Users, BarChart3, LayoutDashboard, 
  Settings, ChevronDown, Bot, Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';
import UserProfile from './UserProfile';
// --- NAYA IMPORT: Path sahi rakha hai ---
import NotificationCenter from './layout/NotificationCenter'; 

const Sidebar = ({ setActiveTab, activeTab, isCollapsed, setIsCollapsed }) => {
  return (
    <div className={`w-full h-full bg-white dark:bg-[#1a1c1e] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200 dark:border-gray-800 shadow-xl transition-all duration-300`}>
      
      {/* Brand Logo & Notification Center */}
      <div className={`h-20 p-5 flex items-center text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-gray-800/50 transition-all ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 text-white shrink-0">B</div>
          {!isCollapsed && (
            <span className="font-bold tracking-tight text-lg uppercase italic whitespace-nowrap animate-in fade-in slide-in-from-left-4 text-zinc-900 dark:text-white">
              Base<span className="text-blue-600">Key</span>
            </span>
          )}
        </div>

        {/* --- BELL ICON: Notification logic remains intact --- */}
        {!isCollapsed && (
          <div className="animate-in fade-in zoom-in duration-500">
            <NotificationCenter />
          </div>
        )}
      </div>

      {/* Navigation - Main Neural Paths */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-hide">
        {!isCollapsed && <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold mb-3 block px-3 italic">Main System</label>}
        
        <NavItem icon={<MessageSquare size={20}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} isCollapsed={isCollapsed} />
        <NavItem icon={<Users size={20}/>} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} isCollapsed={isCollapsed} />
        <NavItem icon={<Zap size={20}/>} label="Interactive Flow" active={activeTab === 'flow'} onClick={() => setActiveTab('flow')} isCollapsed={isCollapsed} />
        <NavItem icon={<Bot size={20}/>} label="AI Integration" active={activeTab === 'integration'} onClick={() => setActiveTab('integration')} isCollapsed={isCollapsed} />
        <NavItem icon={<BarChart3 size={20}/>} label="Reports" isCollapsed={isCollapsed} />

        <div className={`mt-8 mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'px-3 justify-between'}`}>
           {!isCollapsed ? (
             <>
               <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold whitespace-nowrap">Config Node</label>
               <ChevronDown size={12} className="text-zinc-400 dark:text-zinc-600" />
             </>
           ) : (
             <div className="w-full h-px bg-zinc-200 dark:border-gray-800 mx-2"></div>
           )}
        </div>
        
        <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isCollapsed={isCollapsed} />
        {/* Logic: Account Settings renamed to Settings for unified modular access */}
        <NavItem icon={<Settings size={20}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isCollapsed={isCollapsed} />
      </nav>

      {/* --- SIDEBAR COLLAPSE TOGGLE --- */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-gray-800">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all`}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-bold">Collapse Sidebar</span>}
        </button>
      </div>

      {/* --- FINAL FOOTER: USER PROFILE NODE --- */}
      <div className={`p-4 border-t border-zinc-100 dark:border-gray-800 flex relative z-[100] ${isCollapsed ? 'justify-center' : ''}`}>
        <div className={isCollapsed ? 'w-10' : 'w-full'}>
            <UserProfile isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
};

// NavItem Component: Optimized for the BaseKey Neural Design
const NavItem = ({ icon, label, active, onClick, isCollapsed }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : ""} 
    className={`w-full flex items-center gap-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'}
      ${active 
        ? 'bg-zinc-100 dark:bg-[#27292d] text-blue-600 dark:text-white shadow-sm border border-zinc-200 dark:border-white/5' 
        : 'text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#212327] hover:text-zinc-900 dark:hover:text-gray-200'
      }`}
  >
    <span className={`${active ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-400 dark:text-gray-500'}`}>{icon}</span>
    {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
  </button>
);

export default Sidebar;
