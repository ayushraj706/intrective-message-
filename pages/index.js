import Sidebar from '../components/Sidebar';
import Configuration from '../components/Configuration';
import Integration from '../components/Integration';
import Inbox from '../components/Inbox'; // Dashboard के लिए Inbox तैयार है
import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'inbox' && <Inbox />}
        {activeTab === 'whatsapp-config' && <Configuration />}
        {activeTab === 'integration' && <Integration />}
      </main>
    </div>
  );
}
