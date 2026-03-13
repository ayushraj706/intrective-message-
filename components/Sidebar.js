import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Key, 
  ShieldCheck, 
  BarChart3, 
  Link as LinkIcon,
  Bot
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: <LayoutDashboard size={20} />, 
      link: '#dashboard',
      color: 'text-blue-400'
    },
    { 
      name: 'Chat Inbox', 
      icon: <MessageSquare size={20} />, 
      link: '#inbox', // Yahan hum baad mein vue-advanced-chat dalenge
      color: 'text-green-400'
    },
    { 
      name: 'WhatsApp Config', 
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="20" alt="WA" />, 
      link: '#whatsapp-config',
      color: 'text-emerald-500'
    },
    { 
      name: 'AI Integration', 
      icon: <Bot size={20} />, 
      link: '#integration',
      color: 'text-purple-400'
    },
    { 
      name: 'LockerKey', 
      icon: <Key size={20} />, 
      link: 'https://ayus.fun', 
      color: 'text-yellow-500'
    },
    { 
      name: 'SuperKey Admin', 
      icon: <ShieldCheck size={20} />, 
      color: 'text-red-400',
      link: '#superkey'
    },
    { 
      name: 'Analytics', 
      icon: <BarChart3 size={20} />, 
      link: '#analytics',
      color: 'text-indigo-400'
    },
    { 
      name: 'Settings', 
      icon: <Settings size={20} />, 
      link: '#settings',
      color: 'text-gray-400'
    }
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-[#121212] text-white border-r border-gray-800">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ShieldCheck size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">BaseKey AI</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-800 transition-all group border border-transparent hover:border-gray-700"
          >
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </span>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">
              {item.name}
            </span>
          </a>
        ))}
      </nav>

      {/* User Profile Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold">
            AR
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">Ayush Raj</span>
            <span className="text-xs text-gray-500 truncate">SaaS Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
    
