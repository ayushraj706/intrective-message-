import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, Smartphone, FileText, Loader2, Plus, 
  ArrowRight, Trash2, RotateCcw, Cloud, Wifi, WifiOff, Download, Upload
} from 'lucide-react';
import { db, auth } from '../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// ─── WhatsApp Logo SVG ───
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── Constants ───
const LOCAL_STORAGE_KEY = 'basekey_contacts_cache';
const LAST_SYNC_KEY = 'basekey_contacts_last_sync';

const Contacts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [toast, setToast] = useState({ message: '', visible: false });
  const user = auth.currentUser;

  // ─── Network Status Listener ───
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Toast Notification ───
  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  }, []);

  // ─── Load from localStorage FIRST (Instant!) ───
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setExtractedContacts(parsed);
        return true;
      }
    } catch (err) {
      console.error('Cache parse error:', err);
    }
    return false;
  }, []);

  // ─── Save to localStorage ───
  const saveToCache = useCallback((contacts) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.error('Cache save error:', err);
    }
  }, []);

  // ─── Load from Firebase (Background Sync) ───
  const loadFromCloud = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setSyncStatus('syncing');
    try {
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const rawData = docSnap.data().numbers || [];
        const formattedData = rawData.map(item => 
          typeof item === 'string' ? { number: item, isWhatsApp: true } : item
        );
        
        setExtractedContacts(formattedData);
        saveToCache(formattedData);
        setSyncStatus('synced');
      } else {
        setSyncStatus('idle');
      }
    } catch (err) { 
      console.error('Cloud fetch error:', err);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [user, saveToCache]);

  // ─── Initial Load: Cache first, then Cloud ───
  useEffect(() => {
    const hasCache = loadFromCache();
    
    if (hasCache) {
      setIsLoading(false);
      if (isOnline && user) {
        loadFromCloud();
      }
    } else {
      loadFromCloud();
    }
  }, [loadFromCache, loadFromCloud, isOnline, user]);

  // ─── Sync to Cloud ───
  const syncToCloud = useCallback(async (contacts) => {
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      await setDoc(docRef, { 
        numbers: contacts, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      
      saveToCache(contacts);
      setSyncStatus('synced');
    } catch (err) { 
      console.error('Cloud sync error:', err);
      setSyncStatus('error');
    }
  }, [user, saveToCache]);

  // ─── Manual Sync Trigger ───
  const handleManualSync = useCallback(async () => {
    if (!isOnline) {
      alert('No internet connection. Changes saved locally.');
      return;
    }
    await loadFromCloud();
  }, [isOnline, loadFromCloud]);

  // ─── Export to CSV ───
  const exportToCSV = useCallback(() => {
    const csvContent = [
      ['Phone Number', 'WhatsApp'].join(','),
      ...extractedContacts.map(c => [c.number, c.isWhatsApp ? 'Yes' : 'No'].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basekey-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [extractedContacts]);

  // ─── WhatsApp Message ───
  const handleMessage = useCallback((number) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  }, []);

  // ─── File Upload ───
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.split(','));
      if (rows.length < 2) { 
        setIsUploading(false); 
        return; 
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));

      if (phoneIndex === -1) {
        alert("Phone number column not found!");
        setIsUploading(false);
        return;
      }

      const newNumbers = [];
      for (let i = 1; i < rows.length; i++) {
        let phone = rows[i][phoneIndex];
        if (phone) {
          let cleanPhone = phone.replace(/[^0-9]/g, '').trim();
          if (cleanPhone.length >= 10) {
            const num = '+' + cleanPhone;
            if (!extractedContacts.some(c => c.number === num)) {
              newNumbers.push({ number: num, isWhatsApp: true }); 
            }
          }
        }
      }

      const updatedList = [...extractedContacts, ...newNumbers];
      setExtractedContacts(updatedList);
      saveToCache(updatedList);
      await syncToCloud(updatedList);
      setIsUploading(false);
      showToast(`${newNumbers.length} contacts imported successfully!`);
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      alert('File read error!');
    };
    
    reader.readAsText(file);
  }, [extractedContacts, saveToCache, syncToCloud, showToast]);

  // ─── Delete Contact ───
  const deleteContact = useCallback(async (numToDelete) => {
    const updatedList = extractedContacts.filter(c => c.number !== numToDelete);
    setExtractedContacts(updatedList);
    saveToCache(updatedList);
    await syncToCloud(updatedList);
  }, [extractedContacts, saveToCache, syncToCloud]);

  // ─── Clear All ───
  const clearAllContacts = useCallback(async () => {
    if (window.confirm("Delete all contacts from cloud and local storage?")) {
      setExtractedContacts([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
      await syncToCloud([]);
    }
  }, [syncToCloud]);

  // ─── Filtered Contacts ───
  const filteredContacts = useMemo(() => 
    extractedContacts.filter(c => 
      c.number && c.number.includes(searchTerm)
    ),
    [extractedContacts, searchTerm]
  );

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: extractedContacts.length,
    whatsapp: extractedContacts.filter(c => c.isWhatsApp).length,
    recent: extractedContacts.slice(-5).length
  }), [extractedContacts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] p-6 md:p-10 font-sans transition-colors duration-300">
      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        
        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight dark:text-white">
                Contacts
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold">
                {stats.total}
              </span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">Manage and message your contacts</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {isOnline ? (
                <Wifi size={14} className="text-emerald-500" />
              ) : (
                <WifiOff size={14} className="text-amber-500" />
              )}
              <span className={`text-xs font-semibold ${
                syncStatus === 'syncing' ? 'text-blue-500' :
                syncStatus === 'synced' ? 'text-emerald-500' :
                syncStatus === 'error' ? 'text-red-500' :
                'text-zinc-400'
              }`}>
                {syncStatus === 'syncing' ? 'Syncing...' :
                 syncStatus === 'synced' ? 'Synced' :
                 syncStatus === 'error' ? 'Error' :
                 isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <button 
              onClick={handleManualSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
              title="Sync from cloud"
            >
              <Cloud size={18} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
            </button>

            <button 
              onClick={exportToCSV}
              disabled={extractedContacts.length === 0}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
              title="Export CSV"
            >
              <Download size={18} />
            </button>

            {extractedContacts.length > 0 && (
              <button 
                onClick={clearAllContacts} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-semibold text-sm hover:bg-red-100 transition-all"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            
            <label className="group flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-600/25 active:scale-95">
              {isUploading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              )}
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".csv, text/csv, application/vnd.ms-excel, text/plain" 
              />
            </label>
          </div>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            icon={<Users size={22} />} 
            label="Total Contacts" 
            value={stats.total}
            color="blue"
          />
          <StatCard 
            icon={<WhatsAppIcon />} 
            label="WhatsApp Ready" 
            value={stats.whatsapp}
            color="emerald"
          />
          <StatCard 
            icon={<Upload size={22} />} 
            label="Recently Added" 
            value={stats.recent}
            color="violet"
          />
        </div>

        {/* ─── Main Content ─── */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Search Bar */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-3 text-zinc-400" size={18} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..." 
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none dark:text-white focus:ring-2 ring-blue-500/20 transition-all placeholder:text-zinc-400" 
              />
            </div>
          </div>
          
          {/* Contact List */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact, i) => (
                <ContactRow 
                  key={contact.number + i}
                  contact={contact}
                  onMessage={() => handleMessage(contact.number)}
                  onDelete={() => deleteContact(contact.number)}
                />
              ))
            ) : (
              <EmptyState hasContacts={extractedContacts.length > 0} />
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
          <p>Last synced: {localStorage.getItem(LAST_SYNC_KEY) ? new Date(localStorage.getItem(LAST_SYNC_KEY)).toLocaleString() : 'Never'}</p>
          <p>{filteredContacts.length} of {extractedContacts.length} shown</p>
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card Component ───
const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-black dark:text-white mt-1">{value}</h3>
    </div>
  );
};

// ─── Contact Row Component ───
const ContactRow = ({ contact, onMessage, onDelete }) => (
  <div className="group flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all duration-200">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-sm">
          {contact.number.slice(-2)}
        </div>
        {contact.isWhatsApp && (
          <div className="absolute -top-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <WhatsAppIcon />
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold text-sm dark:text-zinc-200 tracking-tight font-mono">
          {contact.number}
        </p>
        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
          {contact.isWhatsApp ? 'WhatsApp' : 'Phone'}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-1">
      <button 
        onClick={onDelete}
        className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
      <button 
        onClick={onMessage}
        className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all active:scale-95"
      >
        Message <ArrowRight size={13} />
      </button>
    </div>
  </div>
);

// ─── Empty State Component ───
const EmptyState = ({ hasContacts }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
      <FileText size={28} className="text-zinc-400" />
    </div>
    <p className="text-zinc-900 dark:text-white font-bold text-lg">
      {hasContacts ? 'No matches found' : 'No contacts yet'}
    </p>
    <p className="text-zinc-500 text-sm mt-1 text-center max-w-sm">
      {hasContacts 
        ? 'Try adjusting your search terms' 
        : 'Upload a CSV file to get started with your contact list'}
    </p>
  </div>
);

export default Contacts;
