import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MainDashboard from '../components/MainDashboard';
import dynamic from 'next/dynamic';
import { auth } from '../firebase';
import { useRouter } from 'next/router';

const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default is Channel Selector
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push('/login');
      else setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="h-screen bg-[#111] flex items-center justify-center text-white font-mono">Loading Ayus Hub...</div>;

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden text-white font-sans">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      
      <main className="flex-1 overflow-hidden relative">
        {/* Jab 'Inboxes' clicked ho tab hi selector dikhega */}
        {activeTab === 'dashboard' && <MainDashboard />}
        
        {/* Jab 'My Inbox' clicked ho tab hi chat library dikhegi */}
        {activeTab === 'inbox' && <Inbox />}

        {activeTab === 'contacts' && <div className="p-10 text-gray-500">Contacts List (Coming via PDF scan)</div>}
      </main>
    </div>
  );
}
