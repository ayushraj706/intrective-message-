import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import AIIntegration from '../components/setup/AIIntegration';
import Contacts from '../components/Contacts';
import { Menu, Loader2 } from 'lucide-react';

const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });
const FlowBuilder = dynamic(() => import('../components/FlowBuilder'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Custom Auth Check
    const session = localStorage.getItem('basekey_session');
    
    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">Initializing BaseKey Neural Link...</span>
    </div>
  );

  // Logout function (Aap ise Sidebar mein use kar sakte hain)
  const handleLogout = () => {
    localStorage.removeItem('basekey_session');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#080808] overflow-hidden text-zinc-900 dark:text-white font-sans transition-all">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64`}>
        <Sidebar setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} activeTab={activeTab} />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase">BaseKey</span>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && <MainDashboard />}
          {activeTab === 'inbox' && <Inbox />}
          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <Contacts />}
          {activeTab === 'flow' && <FlowBuilder />}
        </div>
      </main>
    </div>
  );
}
