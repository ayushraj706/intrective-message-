import React from 'react';
import { MessageSquare, Users, BarChart3, Globe, Settings, ChevronDown, Bot, Zap } from 'lucide-react';

const Sidebar = ({ setActiveTab, activeTab }) => {
  return (
    <div className="w-64 h-screen bg-white dark:bg-[#1a1c1e] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200 dark:border-gray-800 shadow-xl transition-colors duration-300">
      <div className="p-5 flex items-center gap-3 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-gray-800/50">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 text-white">A</div>
        <span className="font-bold tracking-tight text-lg uppercase">BaseKey</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold mb-3 block px-3">Main</label>
        
        <NavItem icon={<MessageSquare size={19}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        
        <NavItem icon={<Users size={19}/>} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
        
        {/* NAYA FLOW BUILDER OPTION */}
        <NavItem 
          icon={<Zap size={19}/>} 
          label="Interactive Flow" 
          active={activeTab === 'flow'} 
          onClick={() => setActiveTab('flow')} 
        />
        
        <NavItem icon={<Bot size={19}/>} label="AI Integration" active={activeTab === 'integration'} onClick={() => setActiveTab('integration')} />
        
        <NavItem icon={<BarChart3 size={19}/>} label="Reports" />

        <div className="mt-8 mb-3 px-3 flex justify-between items-center">
           <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-bold">Settings</label>
           <ChevronDown size={12} className="text-zinc-400 dark:text-zinc-600" />
        </div>
        
        <NavItem icon={<Globe size={19}/>} label="Inboxes" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        
        <NavItem icon={<Settings size={19}/>} label="Account Settings" />
      </nav>

      <div className="p-5 border-t border-zinc-100 dark:border-gray-800 flex items-center gap-3 bg-zinc-50 dark:bg-[#16181a]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/20"></div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Ayush Raj</span>
            <span className="text-[10px] text-zinc-500 dark:text-gray-500">BaseKey Admin</span>
        </div>
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
