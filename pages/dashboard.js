// ... (Imports same rahenge)

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
        // 🔥 FIX: Strictly user.uid use karo taaki Webhook se sync ho
        const docRef = doc(db, "configs", user.uid);
        
        const unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              setSysConfig(data);

              // ⚡ REAL-TIME AUTO SWITCH
              // Agar user setup page par betha hai aur Meta verify kar deta hai
              if (data.isFbVerified && inboxType === 'messenger-setup') {
                setInboxType('messenger-inbox');
              }
              if (data.isVerified && inboxType === 'whatsapp-setup') {
                setInboxType('whatsapp-inbox');
              }
          } else {
              setSysConfig({}); 
          }
        });
        return () => unsubscribeConfig();
      }
    });

    return () => unsubscribeAuth();
  }, [router, inboxType]); // inboxType dependency zaroori hai switch ke liye

  // ... (handleTabChange aur loading UI same rahega)

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#080808] overflow-hidden text-zinc-900 dark:text-white font-sans transition-all duration-500">
      
      {/* Sidebar logic */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar setActiveTab={handleTabChange} activeTab={activeTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        {/* Mobile Header Logic */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu size={24} /></button>
          <span className="font-black text-lg tracking-tighter text-blue-600 italic uppercase flex-1 text-center ml-4">BaseKey</span>
        </div>

        <div className="flex-1 overflow-hidden relative overflow-y-auto scrollbar-hide">
          {activeTab === 'dashboard' && <MainDashboard />}
          
          {activeTab === 'inbox' && !inboxType && (
            <div className="p-10 md:p-16 h-full bg-[#080808] overflow-y-auto pb-40">
               <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">My <span className="text-blue-500">Inboxes</span></h2>
               <p className="text-zinc-500 mb-12 text-sm font-medium">Choose a channel to start automation.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 
                 {/* WHATSAPP CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isVerified ? 'whatsapp-inbox' : 'whatsapp-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-green-500/30 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden">
                   <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${sysConfig?.isVerified ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-zinc-800'}`}></div>
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500/10 transition-all">
                     <Smartphone size={24} className="text-zinc-400 group-hover:text-green-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">WhatsApp</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{sysConfig?.isVerified ? 'Connected' : 'Setup Required'}</p>
                 </div>

                 {/* MESSENGER CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isFbVerified ? 'messenger-inbox' : 'messenger-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-600/30 cursor-pointer transition-all hover:-translate-y-1 group relative">
                   <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${sysConfig?.isFbVerified ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-zinc-800'}`}></div>
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/10 transition-all">
                     <Facebook size={24} className="text-zinc-400 group-hover:text-blue-600" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Messenger</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{sysConfig?.isFbVerified ? 'Connected' : 'Setup Required'}</p>
                 </div>

                 {/* INSTAGRAM CARD */}
                 <div onClick={() => setInboxType(sysConfig?.isIgVerified ? 'instagram-inbox' : 'instagram-setup')} className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 hover:border-pink-500/30 cursor-pointer transition-all hover:-translate-y-1 group relative">
                   <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${sysConfig?.isIgVerified ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-zinc-800'}`}></div>
                   <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-500/10 transition-all">
                     <Instagram size={24} className="text-zinc-400 group-hover:text-pink-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic">Instagram</h3>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{sysConfig?.isIgVerified ? 'Connected' : 'Setup Required'}</p>
                 </div>

                 {/* GMAIL, TELEGRAM Cards remains same but add status dots like above */}
                 {/* ... */}

               </div>
            </div>
          )}

          {/* RENDERING CORE */}
          {activeTab === 'inbox' && (
            <>
              {inboxType === 'whatsapp-setup' && <WhatsAppSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'whatsapp-inbox' && <WhatsAppInbox onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-setup' && <FacebookSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'messenger-inbox' && <InboxBase platform="facebook" themeColor="messenger" onBack={() => setInboxType(null)} />}
              {inboxType === 'instagram-setup' && <InstagramSetup onBack={() => setInboxType(null)} />}
              {inboxType === 'instagram-inbox' && <InboxBase platform="instagram" themeColor="blue-bot" onBack={() => setInboxType(null)} />}
              {/* ... other inboxes */}
            </>
          )}

          {/* Other tabs remain same */}
        </div>
      </main>
    </div>
  );
                   }
                
