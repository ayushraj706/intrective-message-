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

// --- SETUP COMPONENTS ---
import TelegramAPISetup from '../components/setup/TelegramAPISetup';
import TelegramBotSetup from '../components/setup/TelegramBotSetup'; 
import WhatsAppSetup from '../components/setup/WhatsAppSetup';       
import GmailSetup from '../components/setup/GmailSetup'; 
import FacebookSetup from '../components/setup/FacebookSetup'; 
import InstagramSetup from '../components/setup/InstagramSetup'; 

import { Menu, Loader2, Smartphone, Globe, Mail, Bot, Facebook, Instagram } from 'lucide-react'; 

// --- INBOX COMPONENTS (Dynamic) ---
// FIX: Path ko naye modular folder 'whatsapp' par point kiya hai
const WhatsAppInbox = dynamic(() => import('../components/inbox/whatsapp/WhatsAppInbox'), { ssr: false });
const TelegramBotInbox = dynamic(() => import('../components/inbox/TelegramBotInbox'), { ssr: false });
const TelegramAPIInbox = dynamic(() => import('../components/inbox/TelegramAPIInbox'), { ssr: false });
const GmailInbox = dynamic(() => import('../components/inbox/GmailInbox'), { ssr: false });
const InboxBase = dynamic(() => import('../components/inbox/InboxBase'), { ssr: false }); 

const FlowBuilder = dynamic(() => import('../components/FlowBuilder'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inboxType, setInboxType] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sysConfig, setSysConfig] = useState(null); 
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('basekey_session');
    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Path: configs/{email_or_uid}
        const unsubscribeConfig = onSnapshot(doc(db, "configs", user.email || user.uid), (docSnap) => {
          if (docSnap.exists()) {
              setSysConfig(docSnap.data());
          } else {
              setSysConfig({}); 
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
      <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">Neural Link Active...</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#080808] overflow-hidden text-zinc-900 dark:text-white font-sans transition-all duration-500">
      
      {/* SIDEBAR NODE */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar setActiveTab={handleTabChange} activeTab={activeTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase flex-1 text-center ml-4">BaseKey</span>
        </div>

        <div className="flex-1 overflow-hidden relative overflow-y-auto scrollbar-hide">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-10 md:p-16 h-full bg-[#080808] overflow-y-auto pb-40">
               <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">My <span className="text-blue-500">Inboxes</span></h2>
               <p className="text-zinc-500 mb-12 text-sm font-medium">Choose a channel to start automation.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 
                 {/* WHATSAPP CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isVerified ? 'whatsapp-inbox' : 'whatsapp-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-green-500/30 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500/10 transition-all">
                     <Smartphone size={24} className="text-zinc-400 group-hover:text-green-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">WhatsApp</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Connect Business API</p>
                 </div>

                 {/* MESSENGER CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isFbVerified ? 'messenger-inbox' : 'messenger-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-600/30 cursor-pointer transition-all hover:-translate-y-1 group">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/10 transition-all">
                     <Facebook size={24} className="text-zinc-400 group-hover:text-blue-600" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Messenger</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Connect Facebook Page</p>
                 </div>

                 {/* INSTAGRAM CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isIgVerified ? 'instagram-inbox' : 'instagram-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-pink-500/30 cursor-pointer transition-all hover:-translate-y-1 group">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-500/10 transition-all">
                     <Instagram size={24} className="text-zinc-400 group-hover:text-pink-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Instagram</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Link IG Business</p>
                 </div>

                 {/* GMAIL CARD */}
                 <div onClick={() => setInboxType(sysConfig?.gmailConnected ? 'gmail-inbox' : 'gmail-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-red-500/30 cursor-pointer transition-all hover:-translate-y-1 group">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-500/10 transition-all">
                     <Mail size={24} className="text-zinc-400 group-hover:text-red-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Gmail</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Manage Google Mails</p>
                 </div>

                 {/* TELEGRAM API CARD */}
                 <div onClick={() => setInboxType(sysConfig?.telegramSession ? 'telegram-api-inbox' : 'telegram-api-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-400/30 cursor-pointer transition-all hover:-translate-y-1 group">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-400/10 transition-all">
                      <Globe size={24} className="text-zinc-300 group-hover:text-blue-400" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Telegram API</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Custom Client API</p>
                 </div>

                 {/* TELEGRAM BOT CARD */}
                 <div onClick={() => setInboxType(sysConfig?.telegramBotToken ? 'telegram-bot-inbox' : 'telegram-bot-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-400/30 cursor-pointer transition-all hover:-translate-y-1 group">
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-400/10 transition-all">
                      <Bot size={24} className="text-zinc-300 group-hover:text-blue-400" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Telegram Bot</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Automate via BotFather</p>
                 </div>

               </div>
            </div>
          )}

          {/* MAIN INBOX ROUTING */}
          {activeTab === 'inbox' && (
            <>
              {inboxType === 'whatsapp-setup' && <WhatsAppSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-inbox' && <WhatsAppInbox onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-setup' && <FacebookSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-inbox' && <InboxBase platform="facebook" themeColor="messenger" onBack={() => setInboxType(null)} />}
              {inboxType === 'instagram-setup' && <InstagramSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'instagram-inbox' && <InboxBase platform="instagram" themeColor="blue-bot" onBack={() => setInboxType(null)} />}
              {inboxType === 'gmail-setup' && <GmailSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'gmail-inbox' && <GmailInbox onBack={() => setInboxType(null)} />}
              {inboxType === 'telegram-bot-setup' && <TelegramBotSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'telegram-bot-inbox' && <TelegramBotInbox onBack={() => setInboxType(null)} />}
              {inboxType === 'telegram-api-setup' && <TelegramAPISetup onBack={() => setInboxType(null)} />}
              {inboxType === 'telegram-api-inbox' && <TelegramAPIInbox onBack={() => setInboxType(null)} />}
            </>
          )}

          {/* OTHER SYSTEM PATHS */}
          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </main>
    </div>
  );
                   }
