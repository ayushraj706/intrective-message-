import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { toast } from 'sonner';
import { Facebook, Zap, RefreshCw, ShieldCheck, X } from 'lucide-react';

const FacebookSetup = ({ onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLiveVerified, setIsLiveVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  
  const email = auth.currentUser?.email?.toLowerCase().trim() || localStorage.getItem('admin_email');
  const webhookUrl = `https://intrective-message.vercel.app/api/meta-webhook/${encodeURIComponent(email || '')}`;

  // 📡 LIVE LISTENER: Database ko har pal check karo
  useEffect(() => {
    if (showModal && email) {
      const unsubscribe = onSnapshot(doc(db, "configs", email), (docSnap) => {
        if (docSnap.exists() && docSnap.data().isFbVerified === true) {
          setIsLiveVerified(true);
          toast.success("Real-time Handshake Success!");
        }
      });
      return () => unsubscribe();
    }
  }, [showModal, email]);

  const handleConnect = async () => {
    if (!email) return toast.error("Session missing!");
    const newToken = `bk_meta_${Math.random().toString(36).substring(2, 10)}`;
    setVerifyToken(newToken);

    try {
      await setDoc(doc(db, "configs", email), {
        fbVerifyToken: newToken,
        isFbVerified: false, 
        updatedAt: new Date()
      }, { merge: true });
      setShowModal(true);
    } catch (e) { toast.error("Database Write Failed"); }
  };

  return (
    <div className="p-20 text-center">
       <button onClick={handleConnect} className="bg-blue-600 p-6 rounded-3xl font-black">Initialize Connection</button>

       {showModal && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-10 z-[999]">
           <div className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/10 text-center max-w-lg w-full">
              <div className="mb-6 flex justify-center">
                {isLiveVerified ? <ShieldCheck size={60} className="text-green-500" /> : <RefreshCw size={60} className="animate-spin text-blue-500" />}
              </div>
              <h2 className="text-2xl font-black italic uppercase mb-8">{isLiveVerified ? 'Verified!' : 'Awaiting Handshake'}</h2>
              
              <div className="text-left space-y-4 bg-black p-6 rounded-2xl border border-white/5 mb-8">
                <p className="text-[10px] text-zinc-500 uppercase font-black">URL</p>
                <code className="text-[10px] text-blue-400 break-all">{webhookUrl}</code>
              </div>

              {isLiveVerified && (
                <button onClick={() => window.location.reload()} className="w-full bg-green-600 p-5 rounded-2xl font-black uppercase italic">Activate Inbox</button>
              )}
           </div>
         </div>
       )}
    </div>
  );
};
export default FacebookSetup;
