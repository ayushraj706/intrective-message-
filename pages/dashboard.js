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

// --- NAYA COMPONENT IMPORT ---
import AddInbox from '../components/inbox/AddInbox'; 

import { Menu, Loader2 } from 'lucide-react'; 

// --- INBOX COMPONENTS (Dynamic) ---
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
    // Jab tab change ho toh sub-inbox states reset kar do
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
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <Sidebar 
          setActiveTab={handleTabChange} 
          activeTab={activeTab} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase flex-1 text-center ml-4">BaseKey</span>
        </div>

        <div className="flex-1 overflow-hidden relative overflow-y-auto scrollbar-hide">
          
          {/* 1. ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {/* 2. ADD INBOX (Naya logic jo humne banaya) */}
          {activeTab === 'add-inbox' && <AddInbox />}

          {/* 3. MY INBOX (Yahan sirf active chats dikhenge) */}
          {activeTab === 'inbox' && (
            <div className="h-full">
              {/* Agar koi inbox selected nahi hai toh default view */}
              {!inboxType ? (
                <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                   <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                      <Loader2 className="text-blue-500 animate-spin-slow" size={40} />
                   </div>
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter">Initializing <span className="text-blue-500">Neural Inbox</span></h2>
                   <p className="text-zinc-500 text-sm mt-2 max-w-xs">Select a verified node from the sidebar or Add Inbox to start messaging.</p>
                </div>
              ) : (
                <>
                  {inboxType === 'whatsapp-inbox' && <WhatsAppInbox onBack={() => setInboxType(null)} />}
                  {inboxType === 'messenger-inbox' && <InboxBase platform="facebook" themeColor="messenger" onBack={() => setInboxType(null)} />}
                  {inboxType === 'instagram-inbox' && <InboxBase platform="instagram" themeColor="blue-bot" onBack={() => setInboxType(null)} />}
                  {inboxType === 'gmail-inbox' && <GmailInbox onBack={() => setInboxType(null)} />}
                  {inboxType === 'telegram-bot-inbox' && <TelegramBotInbox onBack={() => setInboxType(null)} />}
                  {inboxType === 'telegram-api-inbox' && <TelegramAPIInbox onBack={() => setInboxType(null)} />}
                </>
              )}
            </div>
          )}

          {/* 4. OTHER SYSTEM PATHS */}
          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
          {activeTab === 'settings' && <AccountSettings />}
          
        </div>
      </main>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
                    }
            
