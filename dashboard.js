import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import Configuration from '../components/Configuration';
import Integration from '../components/Integration';
import { useState } from 'react';

// SSR: false का मतलब है कि ये सिर्फ ब्राउज़र में लोड होगा
const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="flex h-screen bg-black overflow-hidden text-white">
      <Sidebar setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'inbox' && <Inbox />}
        {activeTab === 'whatsapp-config' && <Configuration />}
        {activeTab === 'integration' && <Integration />}
      </main>
    </div>
  );
}
