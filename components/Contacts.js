import React, { useState, useEffect } from 'react';
import { Users, Search, Smartphone, FileText, Loader2, Plus, ArrowRight, Trash2, RotateCcw } from 'lucide-react';
import { db, auth } from '../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';

// WhatsApp Logo SVG (As seen in your photo)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Contacts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const user = auth.currentUser;

  // 1. क्लाउड से डेटा लोड करना (With Error Handling)
  useEffect(() => {
    const fetchFromCloud = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid, "contacts", "list");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const rawData = docSnap.data().numbers || [];
            // पुराने डेटा (String) को नए फॉर्मेट (Object) में बदलना
            const formattedData = rawData.map(item => 
              typeof item === 'string' ? { number: item, isWhatsApp: true } : item
            );
            setExtractedContacts(formattedData);
          }
        } catch (err) {
          console.error("Cloud Load Error:", err);
        }
      }
    };
    fetchFromCloud();
  }, [user]);

  // 2. Firebase में सिंक करना
  const syncToCloud = async (numbers) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      await setDoc(docRef, { numbers, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Cloud Sync Error:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.split(','));
      if (rows.length < 2) { setIsUploading(false); return; }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));

      if (phoneIndex === -1) {
        alert("फ़ोन नंबर वाला कॉलम नहीं मिला!");
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
            // सिर्फ नए नंबर्स जोड़ना
            if (!extractedContacts.some(c => c.number === num)) {
              newNumbers.push({ number: num, isWhatsApp: true }); 
            }
          }
        }
      }

      const updatedList = [...extractedContacts, ...newNumbers];
      setExtractedContacts(updatedList);
      await syncToCloud(updatedList);
      setIsUploading(false);
      alert(`${newNumbers.length} नए नंबर्स प्रोसेस हो गए! ✅`);
    };
    reader.readAsText(file);
  };

  const deleteContact = async (numToDelete) => {
    const updatedList = extractedContacts.filter(c => c.number !== numToDelete);
    setExtractedContacts(updatedList);
    await syncToCloud(updatedList);
  };

  const clearAllContacts = async () => {
    if (window.confirm("क्या आप पूरी लिस्ट क्लाउड से डिलीट करना चाहते हैं?")) {
      setExtractedContacts([]);
      await syncToCloud([]);
    }
  };

  const filteredContacts = extractedContacts.filter(c => 
    c.number && c.number.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section with WhatsApp Plus Icon Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white italic uppercase">BaseKey Cloud</h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">WhatsApp Cloud Database.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {extractedContacts.length > 0 && (
              <button onClick={clearAllContacts} className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 transition-all shadow-sm">
                <RotateCcw size={24} />
              </button>
            )}
            
            {/* WhatsApp Style Rounded Plus Button */}
            <label className="group flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer transition-all shadow-xl shadow-blue-600/30 active:scale-90">
              {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Plus size={32} />}
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".csv, text/csv, application/vnd.ms-excel, text/plain" // Fix for dark files
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <Users size={28} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Verified List</p>
            <h3 className="text-5xl font-black dark:text-white mt-2">{extractedContacts.length}</h3>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/80 backdrop-blur-md">
              <div className="relative w-full">
                <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter contacts..." 
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none dark:text-white focus:ring-2 ring-blue-500/20 transition-all" 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-zinc-100 dark:divide-zinc-800 custom-scrollbar">
              {filteredContacts.length > 0 ? filteredContacts.map((contact, i) => (
                <div key={i} className="group p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-blue-600/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                        <Smartphone size={20} />
                      </div>
                      {/* Logo only for WhatsApp active numbers */}
                      {contact.isWhatsApp && (
                        <div className="absolute -top-1 -right-1 bg-white dark:bg-[#050505] rounded-full p-0.5 shadow-sm">
                          <WhatsAppIcon />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-zinc-200 tracking-tight">{contact.number}</p>
                      {contact.isWhatsApp && <p className="text-[10px] text-green-500 font-bold uppercase">WhatsApp Active</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteContact(contact.number)}
                      className="p-3 text-zinc-400 hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                      Message <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
                  <FileText size={64} className="mb-4" />
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px]">No Contacts Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
        
