import React from 'react';
import { LayoutDashboard, MessageSquare, Settings, Bot, Smartphone, ShieldCheck } from 'lucide-react';

const Sidebar = ({ setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inbox', name: 'Chat Inbox', icon: <MessageSquare size={20} /> },
    { id: 'whatsapp-config', name: 'WhatsApp Config', icon: <Smartphone size={20} /> },
    { id: 'integration', name: 'AI Integration', icon: <Bot size={20} /> },
    { id: 'superkey', name: 'SuperKey Admin', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-[#121212] border-r border-gray-800">
      <div className="p-6 text-xl font-bold text-blue-500">BaseKey AI</div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)} // YE HAI ASLI JADU
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all"
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
      
      {/* LockerKey humne hata diya jaisa tumne kaha */}
      <div className="p-4 border-t border-gray-800 text-[10px] text-gray-600 text-center">
        Ayush Raj (BaseKey)
      </div>
    </div>
  );
};

export default Sidebar;
