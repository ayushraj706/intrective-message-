import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { db, auth } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import AIIntegration from '../components/setup/AIIntegration';
import Contacts from '../components/Contacts';
import AccountSettings from '../components/AccountSettings';

// --- ALL SETUP PAGES IMPORTED ---
import TelegramAPISetup from '../components/setup/TelegramAPISetup';
import TelegramBotSetup from '../components/setup/TelegramBotSetup'; // Naya Import
import WhatsAppSetup from '../components/setup/WhatsAppSetup';       // Naya Import

import { Menu, Loader2, MessageSquare, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';

const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });
const FlowBuilder = dynamic(() => import('../components/FlowBuilder'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inboxType, setInboxType] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Is state mein hum user ka saara setup data store karenge
  const [sysConfig, setSysConfig] = useState(null); 
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('basekey_session');
    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }

    // Config listener jo check karega ki kis-kis channel ka setup ho chuka hai
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubscribeConfig = onSnapshot(doc(db, "configs", user.uid), (docSnap) => {
          if (docSnap.exists()) {
              setSysConfig(docSnap.data());
          } else {
              setSysConfig({}); // Agar naya user hai toh khali config set karo
          }
        });
        return () => unsubscribeConfig();
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

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
        <Sidebar setActiveTab={handleTabChange} activeTab={activeTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase">BaseKey</span>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-hidden relative overflow-y-auto">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-10 md:p-16 h-full bg-[#080808]">
               <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">Inboxes</h2>
               <p className="text-zinc-500 mb-12 text-sm font-medium">Choose a channel to start automation.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 
                 {/* SMART WHATSAPP CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isVerified ? 'whatsapp-inbox' : 'whatsapp-setup')} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:border-green-500/30 cursor-pointer transition-all hover:-translate-y-1 shadow-xl relative overflow-hidden">
                   {sysConfig?.isVerified && (
                      <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" title="Active Link"></div>
                   )}
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                     <Smartphone size={24} className="text-zinc-300" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">WhatsApp</h3>
                   <p className="text-xs text-zinc-500 font-medium">Connect your official WhatsApp Business API</p>
                 </div>

                 {/* SMART TELEGRAM API CARD */}
                 <div onClick={() => setInboxType(sysConfig?.telegramSession ? 'telegram-api-inbox' : 'telegram-api-setup')} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all hover:-translate-y-1 shadow-xl relative overflow-hidden">
                   {sysConfig?.telegramSession && (
                      <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" title="Active Link"></div>
                   )}
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                      <Globe size={24} className="text-zinc-300" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Telegram API</h3>
                   <p className="text-xs text-zinc-500 font-medium">Integrate custom Telegram Client API (MTProto)</p>
                 </div>

                 {/* SMART TELEGRAM BOT CARD */}
                 <div onClick={() => setInboxType(sysConfig?.telegramBotToken ? 'telegram-bot-inbox' : 'telegram-bot-setup')} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:border-blue-400/30 cursor-pointer transition-all hover:-translate-y-1 shadow-xl relative overflow-hidden">
                   {sysConfig?.telegramBotToken && (
                      <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#60a5fa]" title="Active Link"></div>
                   )}
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-300"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13.5C17 14.33 16.33 15 15.5 15H14V17C14 17.55 13.55 18 13 18H11C10.45 18 10 17.55 10 17V15H8.5C7.67 15 7 14.33 7 13.5V11.5C7 10.67 7.67 10 8.5 10H15.5C16.33 10 17 10.67 17 11.5V13.5Z" fill="currentColor"/></svg>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Telegram Bot</h3>
                   <p className="text-xs text-zinc-500 font-medium">Automate via Telegram BotFather token</p>
                 </div>

               </div>
            </div>
          )}

          {/* ALL SMART ROUTING COMPONENTS */}
          
          {/* WhatsApp Route */}
          {activeTab === 'inbox' && inboxType === 'whatsapp-setup' && <WhatsAppSetup onBack={() => setInboxType(null)} />}
          {activeTab === 'inbox' && inboxType === 'whatsapp-inbox' && <Inbox platform="whatsapp" onBack={() => setInboxType(null)} />}

          {/* Telegram Bot Route */}
          {activeTab === 'inbox' && inboxType === 'telegram-bot-setup' && <TelegramBotSetup onBack={() => setInboxType(null)} />}
          {activeTab === 'inbox' && inboxType === 'telegram-bot-inbox' && <Inbox platform="telegram" onBack={() => setInboxType(null)} />}
          
          {/* Telegram API Route */}
          {activeTab === 'inbox' && inboxType === 'telegram-api-setup' && <TelegramAPISetup onBack={() => setInboxType(null)} />}
          {activeTab === 'inbox' && inboxType === 'telegram-api-inbox' && <Inbox platform="telegram-api" onBack={() => setInboxType(null)} />}

          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </main>
    </div>
  );
                   }
                     
