import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { auth } from '../firebase'; // अब यह सही जगह से उठाएगा
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useRouter } from 'next/router';

// कंपोनेंट्स को बाहर वाले फोल्डर से बुलाना (../)
import Sidebar from '../components/Sidebar';
import Configuration from '../components/Configuration';
import Integration from '../components/Integration';

// SSR: false taaki vue-advanced-chat crash na ho
const Inbox = dynamic(() => import('../components/Inbox'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Magic Link Verification Logic
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) email = window.prompt('Confirm Email:');

      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          setLoading(false);
        })
        .catch(() => router.push('/login'));
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) router.push('/login');
        else setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [router]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-mono">Loading BaseKey Dashboard...</div>;

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
