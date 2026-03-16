import React from 'react';
import { 
  MessageSquare, Users, BarChart3, LayoutDashboard, 
  Settings, ChevronDown, Bot, Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';
import UserProfile from './UserProfile';

const Sidebar = ({ setActiveTab, activeTab, isCollapsed, setIsCollapsed }) => {
  return (
    // Width ab dashboard.js control kar raha hai, isliye yahan w-full use kiya hai
    <div className={`w-full h-full bg-white dark:bg-[#1a1c1e] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200 dark:border-gray-800 shadow-xl transition-all duration-300`}>
      
      {/* Brand Logo */}
      <div className={`h-20 p-5 flex items-center gap-3 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-gray-800/50 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 text-white shrink-0">B</div>
        {!isCollapsed && <span className="font-bold tracking-tight text-lg uppercase italic whitespace-nowrap">Base<span className="text-blue-600">Key</span></span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-hide">
        {!isCollapsed && <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold mb-3 block px-3">Main</label>}
        
        <NavItem icon={<MessageSquare size={20}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} isCollapsed={isCollapsed} />
        <NavItem icon={<Users size={20}/>} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} isCollapsed={isCollapsed} />
        <NavItem icon={<Zap size={20}/>} label="Interactive Flow" active={activeTab === 'flow'} onClick={() => setActiveTab('flow')} isCollapsed={isCollapsed} />
        <NavItem icon={<Bot size={20}/>} label="AI Integration" active={activeTab === 'integration'} onClick={() => setActiveTab('integration')} isCollapsed={isCollapsed} />
        <NavItem icon={<BarChart3 size={20}/>} label="Reports" isCollapsed={isCollapsed} />

        <div className={`mt-8 mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'px-3 justify-between'}`}>
           {!isCollapsed ? (
             <>
               <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold whitespace-nowrap">Settings</label>
               <ChevronDown size={12} className="text-zinc-400 dark:text-zinc-600" />
             </>
           ) : (
             <div className="w-full h-px bg-zinc-200 dark:border-gray-800 mx-2"></div>
           )}
        </div>
        
        <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isCollapsed={isCollapsed} />
        <NavItem icon={<Settings size={20}/>} label="Account Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isCollapsed={isCollapsed} />
      </nav>

      {/* --- META STYLE COLLAPSE BUTTON --- */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-gray-800">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all`}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-bold">Collapse</span>}
        </button>
      </div>

      {/* --- USER PROFILE SECTION --- */}
      <div className={`p-4 border-t border-zinc-100 dark:border-gray-800 overflow-hidden flex ${isCollapsed ? 'justify-center' : ''}`}>
        <div className={isCollapsed ? 'w-10' : 'w-full'}>
            <UserProfile isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
};

// NavItem Code
const NavItem = ({ icon, label, active, onClick, isCollapsed }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : ""} // Collapse hone par hover text dikhayega
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
