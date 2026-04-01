import React, { useState } from 'react';
import { 
  MessageSquare, Users, BarChart3, LayoutDashboard, 
  Settings, ChevronDown, Bot, Zap, ChevronLeft, ChevronRight,
  Plus, MessageCircle, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Smooth animation ke liye
import UserProfile from './UserProfile';
import NotificationCenter from './layout/NotificationCenter'; 

const Sidebar = ({ setActiveTab, activeTab, isCollapsed, setIsCollapsed }) => {
  // Dropdown state
  const [isConvOpen, setIsConvOpen] = useState(true);

  return (
    <div className={`w-full h-full bg-white dark:bg-[#1a1c1e] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200 dark:border-gray-800 shadow-xl transition-all duration-300`}>
      
      {/* 1. Brand Logo */}
      <div className={`h-20 p-5 flex items-center text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-gray-800/50 transition-all ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 text-white shrink-0">B</div>
          {!isCollapsed && (
            <span className="font-bold tracking-tight text-lg uppercase italic whitespace-nowrap animate-in fade-in slide-in-from-left-4">
              Base<span className="text-blue-600">Key</span>
            </span>
          )}
        </div>
        {!isCollapsed && <NotificationCenter />}
      </div>

      {/* 2. Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1.5 scrollbar-hide">
        
        {/* OVERVIEW */}
        {!isCollapsed && <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-black mb-2 block px-3 mt-2">Overview</label>}
        <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isCollapsed={isCollapsed} />
        <NavItem icon={<BarChart3 size={20}/>} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} isCollapsed={isCollapsed} />

        {/* CONVERSATION SECTION (DROPDOWN) */}
        {!isCollapsed && <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-black mb-2 block px-3 mt-6">Communication</label>}
        
        <div className="space-y-1">
          {/* Main Dropdown Trigger */}
          <button 
            onClick={() => {
              if(isCollapsed) setIsCollapsed(false);
              setIsConvOpen(!isConvOpen);
            }}
            className={`w-full flex items-center justify-between py-3 rounded-xl text-sm font-bold transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'} hover:bg-zinc-50 dark:hover:bg-[#212327]`}
          >
            <div className="flex items-center gap-4">
              <MessageSquare size={20} className={isConvOpen && !isCollapsed ? 'text-blue-600' : ''} />
              {!isCollapsed && <span className="whitespace-nowrap">Conversations</span>}
            </div>
            {!isCollapsed && (
              isConvOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </button>

          {/* Sub Items */}
          <AnimatePresence>
            {isConvOpen && !isCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col pl-9 space-y-1"
              >
                <SubNavItem 
                  icon={<MessageCircle size={18}/>} 
                  label="My Inbox" 
                  active={activeTab === 'inbox'} 
                  onClick={() => setActiveTab('inbox')} 
                />
                <SubNavItem 
                  icon={<Plus size={18}/>} 
                  label="Add Inbox" 
                  active={activeTab === 'add-inbox'} 
                  onClick={() => setActiveTab('add-inbox')} 
                />
                <SubNavItem 
                  icon={<Users size={18}/>} 
                  label="Contacts" 
                  active={activeTab === 'contacts'} 
                  onClick={() => setActiveTab('contacts')} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NEURAL ENGINE */}
        <div className={`mt-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'px-3 justify-between'}`}>
           {!isCollapsed ? (
             <label className="text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-500 font-black italic">Neural Engine</label>
           ) : (
             <div className="w-full h-px bg-zinc-200 dark:bg-gray-800 mx-2"></div>
           )}
        </div>
        <NavItem icon={<Zap size={20}/>} label="Interactive Flow" active={activeTab === 'flow'} onClick={() => setActiveTab('flow')} isCollapsed={isCollapsed} />
        <NavItem icon={<Bot size={20}/>} label="AI Integration" active={activeTab === 'integration'} onClick={() => setActiveTab('integration')} isCollapsed={isCollapsed} />

        {/* CONFIG */}
        <NavItem icon={<Settings size={20}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isCollapsed={isCollapsed} />
      </nav>

      {/* 3. Collapse Toggle */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-gray-800">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-3 rounded-xl text-zinc-400 hover:text-blue-600 dark:hover:bg-white/5 transition-all group`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />}
          {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Minimize</span>}
        </button>
      </div>

      {/* 4. User Profile */}
      <div className="p-4 border-t border-zinc-100 dark:border-gray-800 flex relative z-[100]">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

// Sub-Navigation Item Component (Chote options ke liye)
const SubNavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all
      ${active 
        ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-600/5' 
        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-gray-200'
      }`}
  >
    <span className={active ? 'text-blue-600' : 'text-zinc-400'}>{icon}</span>
    <span className="whitespace-nowrap tracking-tight">{label}</span>
  </button>
);

const NavItem = ({ icon, label, active, onClick, isCollapsed }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : ""} 
    className={`w-full flex items-center gap-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'}
      ${active 
        ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 border border-blue-100 dark:border-blue-600/20' 
        : 'text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#212327]'
      }`}
  >
    <span className={active ? 'text-blue-600' : 'text-zinc-400'}>{icon}</span>
    {!isCollapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}
  </button>
);

export default Sidebar;
             
