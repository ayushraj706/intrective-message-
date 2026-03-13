import React from 'react';
import { MessageSquare, Users, BarChart3, Globe, Settings, ChevronDown } from 'lucide-react';

const Sidebar = ({ setActiveTab, activeTab }) => {
  return (
    <div className="w-64 h-screen bg-[#1a1c1e] text-gray-400 flex flex-col border-r border-gray-800 shadow-2xl">
      <div className="p-5 flex items-center gap-3 text-white border-b border-gray-800/50">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/20 text-white">A</div>
        <span className="font-bold tracking-tight text-lg">Ayus</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-3 block px-3">Main</label>
        <NavItem icon={<MessageSquare size={19}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        <NavItem icon={<Users size={19}/>} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
        <NavItem icon={<BarChart3 size={19}/>} label="Reports" />

        <div className="mt-8 mb-3 px-3 flex justify-between items-center">
           <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">Settings</label>
           <ChevronDown size={12} className="text-gray-600" />
        </div>
        <NavItem icon={<Globe size={19}/>} label="Inboxes" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Settings size={19}/>} label="Account Settings" />
      </nav>

      <div className="p-5 border-t border-gray-800 flex items-center gap-3 bg-[#16181a]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/10"></div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Ayush Raj</span>
            <span className="text-[10px] text-gray-500">BaseKey Admin</span>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-[#27292d] text-white shadow-md border border-white/5' : 'hover:bg-[#212327] hover:text-gray-200'}`}
  >
    <span className={active ? 'text-blue-500' : 'text-gray-500'}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default Sidebar;

