import React, { useState, useEffect } from 'react'; // React import check karein
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { db, auth } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import { Menu, Loader2, Smartphone, Globe, Mail, Bot, Facebook, Instagram, ChevronRight } from 'lucide-react'; 

// Dynamic components (SSR: false prevents useState errors during build)
const WhatsAppInbox = dynamic(() => import('../components/inbox/WhatsAppInbox'), { ssr: false });
const WhatsAppSetup = dynamic(() => import('../components/setup/WhatsAppSetup'), { ssr: false });
const FacebookSetup = dynamic(() => import('../components/setup/FacebookSetup'), { ssr: false });
const InboxBase = dynamic(() => import('../components/inbox/InboxBase'), { ssr: false });

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
        // 🔥 SYNC FIX: Strictly UID listener (Email use mat karo path mein)
        const docRef = doc(db, "configs", user.uid);
        
        const unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSysConfig(data);
            
            // ⚡ REAL-TIME AUTO SWITCH: Jaise hi Meta verify karega
            if (data.isFbVerified && inboxType === 'messenger-setup') {
               setInboxType('messenger-inbox');
            }
          }
        });
        return () => unsubscribeConfig();
      }
    });
    return () => unsubscribeAuth();
  }, [router, inboxType]);

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden transition-all duration-500 font-sans">
      
      {/* Sidebar Component */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar setActiveTab={(tab) => { setActiveTab(tab); setInboxType(null); }} activeTab={activeTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-10 md:p-20 max-w-5xl mx-auto">
               <div className="mb-12">
                 <h2 className="text-3xl font-black tracking-tight uppercase italic mb-1">My <span className="text-blue-600">Channels</span></h2>
                 <p className="text-zinc-500 text-sm font-medium">Manage your active automation neural links.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* MESSENGER CARD */}
                 <div 
                   onClick={() => setInboxType(sysConfig?.isFbVerified ? 'messenger-inbox' : 'messenger-setup')} 
                   className="bg-[#0c0c0c] p-8 rounded-[2rem] border border-white/5 hover:border-blue-600/30 transition-all cursor-pointer flex items-center justify-between group"
                 >
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${sysConfig?.isFbVerified ? 'bg-blue-600 text-white border-blue-600' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                        <Facebook size={22} />
                      </div>
                      <div>
                        <h3 className="text-md font-bold italic uppercase tracking-tighter">Messenger</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${sysConfig?.isFbVerified ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{sysConfig?.isFbVerified ? 'Verified' : 'Setup Required'}</p>
                        </div>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-zinc-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </div>

                 {/* WHATSAPP CARD */}
                 <div 
                   onClick={() => setInboxType(sysConfig?.isVerified ? 'whatsapp-inbox' : 'whatsapp-setup')} 
                   className="bg-[#0c0c0c] p-8 rounded-[2rem] border border-white/5 hover:border-green-500/30 transition-all cursor-pointer flex items-center justify-between group"
                 >
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${sysConfig?.isVerified ? 'bg-green-600 text-white border-green-600' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="text-md font-bold italic uppercase tracking-tighter">WhatsApp</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${sysConfig?.isVerified ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{sysConfig?.isVerified ? 'Verified' : 'Setup Required'}</p>
                        </div>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-zinc-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </div>

               </div>
            </div>
          )}

          {/* RENDERING CORE */}
          {activeTab === 'inbox' && (
            <div className="h-full overflow-hidden">
              {inboxType === 'messenger-setup' && <FacebookSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-inbox' && <InboxBase platform="facebook" themeColor="messenger" onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-setup' && <WhatsAppSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-inbox' && <WhatsAppInbox onBack={() => setInboxType(null)} />}
            </div>
          )}

          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'settings' && <AccountSettings />}
        </div>
      </main>
    </div>
  );
}
