import React, { useState, useEffect } from 'react';
import { Users, Search, Smartphone, FileText, Loader2, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase'; // Firebase config से db और auth लिया
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Contacts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const user = auth.currentUser;

  // 1. Firebase से डेटा लोड करना (पेज खुलते ही)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExtractedContacts(docSnap.data().numbers || []);
      }
    };
    fetchContacts();
  }, [user]);

  // 2. Firebase में डेटा सेव करने का फंक्शन
  const saveToFirebase = async (numbers) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "contacts", "list");
      await setDoc(docRef, { numbers: numbers }, { merge: true });
    } catch (err) {
      console.error("Firebase Error:", err);
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
          if (cleanPhone.length >= 10) numbersFound.push('+' + cleanPhone);
        }
      }

      const uniqueNumbers = [...new Set([...extractedContacts, ...numbersFound])];
      setExtractedContacts(uniqueNumbers);
      await saveToFirebase(uniqueNumbers); // Firebase में सेव किया
      setIsUploading(false);
      alert(`Firebase में ${uniqueNumbers.length} नंबर्स सुरक्षित हैं! ✅`);
    };

    reader.readAsText(file);
  };

  const deleteContact = async (numToDelete) => {
    const updatedList = extractedContacts.filter(num => num !== numToDelete);
    setExtractedContacts(updatedList);
    await saveToFirebase(updatedList); // डिलीट के बाद सिंक
  };

  const filteredContacts = extractedContacts.filter(num => num.includes(searchTerm));

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white italic uppercase">BaseKey Cloud</h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">Your contacts are synced with Firebase.</p>
          </div>
          
          <label className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            <span>Upload to Cloud</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
          </label>
        </div>

        {/* List UI (बाकी UI वैसा ही रहेगा) */}
        {/* ... (List mapping code) */}
      </div>
    </div>
  );
};

export default Contacts;
