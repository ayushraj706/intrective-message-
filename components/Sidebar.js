import React from 'react';
import { MessageSquare, Users, BarChart3, Settings, ChevronDown, Globe, Smartphone, Send, Bot } from 'lucide-react';

const Sidebar = ({ setActiveTab, activeTab }) => {
  return (
    <div className="w-64 h-screen bg-[#1a1c1e] text-gray-400 flex flex-col border-r border-gray-800">
      <div className="p-4 flex items-center gap-3 text-white border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
        <span className="font-semibold">Ayus</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-2 px-3">Main</div>
        <NavItem icon={<MessageSquare size={18}/>} label="My Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        <NavItem icon={<Users size={18}/>} label="Contacts" />
        <NavItem icon={<BarChart3 size={18}/>} label="Reports" />

        <div className="mt-6 text-[10px] uppercase tracking-wider text-gray-600 font-bold mb-2 px-3 flex justify-between items-center">
          Settings <ChevronDown size={12} />
        </div>
        <NavItem icon={<Globe size={18}/>} label="Inboxes" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Settings size={18}/>} label="Account Settings" />
      </nav>

      <div className="p-4 border-t border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
        <span className="text-xs font-medium text-white">Ayush Raj</span>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-[#27292d] text-white shadow-sm' : 'hover:bg-[#27292d] hover:text-white'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Sidebar;

