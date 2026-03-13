import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import AIIntegration from '../components/setup/AIIntegration';
import dynamic from 'next/dynamic';
import { auth } from '../firebase';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react'; // मोबाइल मेनू के लिए

const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // मोबाइल साइडबार स्टेट
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push('/login');
      else setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-white font-mono uppercase text-[10px] tracking-widest">Loading Ayus Hub...</div>;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#080808] overflow-hidden text-zinc-900 dark:text-white font-sans transition-all">
      
      {/* 1. SIDEBAR (Mobile Friendly) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64`}>
        <Sidebar setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} activeTab={activeTab} />
      </div>

      {/* 2. OVERLAY (Side bar खुला होने पर मोबाइल में बाहर क्लिक करने के लिए) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* MOBILE HEADER (सिर्फ मोबाइल पर दिखेगा) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
            <Menu size={24} />
          </button>
          <span className="font-black text-lg tracking-tighter text-blue-600">BaseKey</span>
          <div className="w-10"></div> {/* बैलेंस के लिए खाली जगह */}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && <MainDashboard />}
          {activeTab === 'inbox' && <Inbox />}
          {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'contacts' && <div className="p-10 text-zinc-500">Contacts logic coming soon...</div>}
        </div>
      </main>
    </div>
  );
}
