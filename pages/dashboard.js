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

// --- SETUP & INBOX (Dynamic for Performance) ---
import FacebookSetup from '../components/setup/FacebookSetup';
const InboxBase = dynamic(() => import('../components/inbox/InboxBase'), { ssr: false });
const WhatsAppInbox = dynamic(() => import('../components/inbox/WhatsAppInbox'), { ssr: false });
const WhatsAppSetup = dynamic(() => import('../components/setup/WhatsAppSetup'), { ssr: false });

import { Menu, Loader2, Smartphone, Globe, Mail, Bot, Facebook, Instagram, ChevronRight } from 'lucide-react'; 

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
    if (!session) return router.push('/login');
    setLoading(false);

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // ZAROORI: UID se listen kar rahe hain (Consistency)
        const unsubscribeConfig = onSnapshot(doc(db, "configs", user.uid), (docSnap) => {
          setSysConfig(docSnap.exists() ? docSnap.data() : {});
        });
        return () => unsubscribeConfig();
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden transition-all duration-500">
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar setActiveTab={(tab) => { setActiveTab(tab); setInboxType(null); }} activeTab={activeTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-black">
          <button onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
          <span className="flex-1 text-center font-black italic uppercase text-blue-600 tracking-widest">BaseKey</span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-12 md:p-20 max-w-6xl mx-auto">
               <div className="mb-16">
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2">My <span className="text-blue-600">Inboxes</span></h2>
                 <p className="text-zinc-500 font-medium tracking-tight">Active automation neural links across all platforms.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* MESSENGER CARD */}
                 <div 
                   onClick={() => setInboxType(sysConfig?.isFbVerified ? 'messenger-inbox' : 'messenger-setup')} 
                   className="bg-[#0c0c0c] p-8 rounded-[2rem] border border-white/5 hover:border-blue-600/30 transition-all cursor-pointer flex items-center justify-between group"
                 >
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Facebook size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold italic uppercase tracking-tighter">Facebook Messenger</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                          {sysConfig?.isFbVerified ? '● Connected' : '○ Setup Required'}
                        </p>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-zinc-800 group-hover:text-white transition-all" />
                 </div>

                 {/* WHATSAPP CARD */}
                 <div 
                   onClick={() => setInboxType(sysConfig?.isVerified ? 'whatsapp-inbox' : 'whatsapp-setup')} 
                   className="bg-[#0c0c0c] p-8 rounded-[2rem] border border-white/5 hover:border-green-500/30 transition-all cursor-pointer flex items-center justify-between group"
                 >
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-500/20 group-hover:bg-green-500 group-hover:text-white transition-all">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold italic uppercase tracking-tighter">WhatsApp Business</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                          {sysConfig?.isVerified ? '● Connected' : '○ Setup Required'}
                        </p>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-zinc-800 group-hover:text-white transition-all" />
                 </div>

               </div>
            </div>
          )}

          {/* RENDERING CORE */}
          {activeTab === 'inbox' && (
            <div className="h-full">
              {inboxType === 'messenger-setup' && <FacebookSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-inbox' && <InboxBase platform="facebook" themeColor="messenger" onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-setup' && <WhatsAppSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-inbox' && <WhatsAppInbox onBack={() => setInboxType(null)} />}
            </div>
          )}

          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </main>
    </div>
  );
}
