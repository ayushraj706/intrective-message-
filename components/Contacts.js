import React, { useState, useEffect } from 'react';
import { Users, Search, Smartphone, FileText, Loader2, Plus, ArrowRight, Trash2, RotateCcw } from 'lucide-react';
// Firebase logic yaha se aayega
import { db, auth } from '../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Contacts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const user = auth.currentUser; // 1. Current logged-in user ki details

  // 2. Firebase Cloud se data load karna (Refresh hone par bhi data rahega)
  useEffect(() => {
    const fetchFromCloud = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid, "contacts", "list");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setExtractedContacts(docSnap.data().numbers || []);
          }
        } catch (err) {
          console.error("Cloud Load Error:", err);
        }
      }
    };
    fetchFromCloud();
  }, [user]);

  // 3. Firebase Cloud mein data save karne ka function
  const syncToCloud = async (numbers) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      await setDoc(docRef, { 
        numbers: numbers,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
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
      
      if (rows.length < 2) {
        alert("File खाली है!");
        setIsUploading(false);
        return;
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));

      if (phoneIndex === -1) {
        alert("CSV में फोन नंबर वाला कॉलम नहीं मिला!");
        setIsUploading(false);
        return;
      }

      const numbersFound = [];
      for (let i = 1; i < rows.length; i++) {
        let phone = rows[i][phoneIndex];
        if (phone) {
          let cleanPhone = phone.replace(/[^0-9]/g, '').trim();
          if (cleanPhone.length >= 10) {
            numbersFound.push('+' + cleanPhone);
          }
        }
      }

      const uniqueNumbers = [...new Set([...extractedContacts, ...numbersFound])];
      setExtractedContacts(uniqueNumbers);
      
      // 4. LocalStorage ki jagah Firebase Sync call kiya
      await syncToCloud(uniqueNumbers); 
      
      setIsUploading(false);
      alert(`${uniqueNumbers.length} नंबर्स क्लाउड में सुरक्षित हैं! ✅`);
    };

    reader.readAsText(file);
  };

  const deleteContact = async (numToDelete) => {
    const updatedList = extractedContacts.filter(num => num !== numToDelete);
    setExtractedContacts(updatedList);
    await syncToCloud(updatedList); // 5. Delete ke baad cloud update
  };

  const clearAllContacts = async () => {
    if (window.confirm("क्या आप पूरी लिस्ट क्लाउड से डिलीट करना चाहते हैं?")) {
      setExtractedContacts([]);
      await syncToCloud([]); // 6. Cloud list saaf karein
    }
  };

  const filteredContacts = extractedContacts.filter(num => num.includes(searchTerm));

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white italic uppercase">BaseKey Cloud</h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">Your contacts are securely synced with Firebase.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {extractedContacts.length > 0 && (
              <button onClick={clearAllContacts} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 transition-all">
                <RotateCcw size={20} />
              </button>
            )}
            <label className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer transition-all active:scale-95">
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              <span>{isUploading ? 'Extracting...' : 'Upload to Cloud'}</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv, text/csv, application/vnd.ms-excel, text/plain" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <Users size={28} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Cloud Synced Contacts</p>
            <h3 className="text-5xl font-black dark:text-white mt-2">{extractedContacts.length}</h3>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <h4 className="font-bold dark:text-white text-lg px-2">Contacts List</h4>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-3 text-zinc-500" size={16} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2.5 pl-11 pr-4 text-xs outline-none dark:text-white" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-zinc-100 dark:divide-zinc-800 custom-scrollbar">
              {filteredContacts.length > 0 ? filteredContacts.map((num, i) => (
                <div key={i} className="group p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-blue-600/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                      <Smartphone size={18} />
                    </div>
                    <span className="font-bold text-sm dark:text-zinc-200">{num}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteContact(num)} className="p-2 text-zinc-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                    <button className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase hover:gap-3 transition-all">
                      Chat <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
                  <FileText size={64} className="mb-4" />
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px]">Cloud is empty</p>
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
  
