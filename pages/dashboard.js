import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { auth } from '../firebase';

// Components Import
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import AIIntegration from '../components/setup/AIIntegration'; // नया सेटअप पेज

// Inbox को dynamic import करना ज़रूरी है (SSR Error से बचने के लिए)
const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default: Channel Selector
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- AUTH CHECK (Session Persistence) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // अगर लॉग-इन नहीं है, तो लॉगिन पेज पर भेजें
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Loading State (Professional Look)
  if (loading) return (
    <div className="h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center transition-colors duration-500">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Verifying Admin Access...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#111111] overflow-hidden text-zinc-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* Sidebar: Tab Switching के लिए setActiveTab पास किया गया है */}
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      
      <main className="flex-1 overflow-hidden relative">
        
        {/* 1. Channel Selector (Inboxes) */}
        {activeTab === 'dashboard' && <MainDashboard />}
        
        {/* 2. Chat Interface (My Inbox) */}
        {activeTab === 'inbox' && <Inbox />}

        {/* 3. AI Setup Page (User अपना AI यहाँ सेट करेगा) */}
        {activeTab === 'integration' && <AIIntegration onBack={() => setActiveTab('dashboard')} />}

        {/* 4. Contacts (PDF Logic के लिए जगह) */}
        {activeTab === 'contacts' && (
          <div className="p-12 animate-in fade-in duration-500">
            <h2 className="text-4xl font-extrabold tracking-tighter mb-4">Contacts</h2>
            <p className="text-zinc-500 text-lg">PDF Upload logic coming soon for data processing...</p>
          </div>
        )}
      </main>
    </div>
  );
}
