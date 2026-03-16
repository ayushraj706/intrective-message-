import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import AIIntegration from '../components/setup/AIIntegration';
import Contacts from '../components/Contacts';
import AccountSettings from '../components/AccountSettings';
import { Menu, Loader2, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });
const FlowBuilder = dynamic(() => import('../components/FlowBuilder'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inboxType, setInboxType] = useState(null); // 'whatsapp' ya 'telegram'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('basekey_session');
    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  // Tab change hone par inboxType reset karo taaki wapas selection screen aa sake
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'inbox') setInboxType(null);
    setIsSidebarOpen(false);
  };

  if (loading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4 font-sans">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">Initializing BaseKey Neural Link...</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#080808] overflow-hidden text-zinc-900 dark:text-white font-sans transition-all duration-500">
      
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar 
          setActiveTab={handleTabChange} 
          activeTab={activeTab} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase">BaseKey</span>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-hidden relative overflow-y-auto">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {/* --- INBOX SELECTION SCREEN --- */}
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-10 md:p-16 h-full bg-[#080808]">
               <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">Inboxes</h2>
               <p className="text-zinc-500 mb-12 text-sm font-medium">Choose a channel to start automation.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* WhatsApp Card */}
                 <div onClick={() => setInboxType('whatsapp')} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all hover:-translate-y-1 shadow-xl">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                     <Smartphone size={24} className="text-zinc-300" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">WhatsApp</h3>
                   <p className="text-xs text-zinc-500 font-medium">Connect your official WhatsApp Business API</p>
                 </div>

                 {/* Telegram Bot Card */}
                 <div onClick={() => setInboxType('telegram')} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:border-blue-400/30 cursor-pointer transition-all hover:-translate-y-1 shadow-xl">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                      {/* Telegram SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-300">
                         <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13.5C17 14.33 16.33 15 15.5 15H14V17C14 17.55 13.55 18 13 18H11C10.45 18 10 17.55 10 17V15H8.5C7.67 15 7 14.33 7 13.5V11.5C7 10.67 7.67 10 8.5 10H15.5C16.33 10 17 10.67 17 11.5V13.5Z" fill="currentColor"/>
                      </svg>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Telegram Bot</h3>
                   <p className="text-xs text-zinc-500 font-medium">Automate via Telegram Bot Father token</p>
                 </div>
               </div>
            </div>
          )}

          {/* Actual Chat Interfaces */}
          {activeTab === 'inbox' && inboxType === 'whatsapp' && <Inbox platform="whatsapp" onBack={() => setInboxType(null)} />}
          {activeTab === 'inbox' && inboxType === 'telegram' && <Inbox platform="telegram" onBack={() => setInboxType(null)} />}

          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </main>
    </div>
  );
                   }
            
