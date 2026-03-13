import React, { useState } from 'react';
import { Users, Search, Smartphone, FileText, Loader2, Plus, ArrowRight } from 'lucide-react';

const Contacts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    // फाइल पढ़ने के लिए 'FileReader' का इस्तेमाल
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n'); // लाइन दर लाइन तोड़ना
      const numbersFound = [];

      // CSV की हर लाइन को चेक करना
      rows.forEach((row, index) => {
        if (index === 0) return; // पहली लाइन (Header) को छोड़ना
        
        const columns = row.split(','); // कोमा से अलग करना
        // तुम्हारी फाइल में नंबर 2nd कॉलम में है (Index 1)
        let phone = columns[1]; 

        if (phone) {
          // नंबर को साफ़ करना (Space हटाना, फालतू करैक्टर हटाना)
          const cleanPhone = phone.replace(/["\s-]/g, '').trim();
          if (cleanPhone.length >= 10) {
            numbersFound.push(cleanPhone);
          }
        }
      });

      // डुप्लीकेट नंबर्स हटाना
      const uniqueNumbers = [...new Set(numbersFound)];
      setExtractedContacts(uniqueNumbers);
      setIsUploading(false);
      alert(`बधाई हो! ${uniqueNumbers.length} नंबर्स लोड हो गए हैं। 🚀`);
    };

    reader.onerror = () => {
      alert("फाइल पढ़ने में दिक्कत आई!");
      setIsUploading(false);
    };

    reader.readAsText(file); // फाइल को टेक्स्ट के रूप में पढ़ना शुरू करें
  };

  const filteredContacts = extractedContacts.filter(num => num.includes(searchTerm));

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white italic">BaseKey Contacts</h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium">Upload your CSV and get WhatsApp numbers instantly.</p>
          </div>
          
          <label className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
            <span>{isUploading ? 'Extracting...' : 'Upload CSV'}</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload} 
              accept=".csv,.txt" 
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Card */}
          <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <Users size={28} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Total Numbers</p>
            <h3 className="text-5xl font-black dark:text-white mt-2">{extractedContacts.length}</h3>
            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-zinc-400 text-xs italic">
                फाइल से निकाले गए नंबर्स की लिस्ट नीचे है।
              </p>
            </div>
          </div>

          {/* Contacts List Card */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
              <h4 className="font-bold dark:text-white text-lg px-2">Contacts List</h4>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-3 text-zinc-500" size={16} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter numbers..." 
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2.5 pl-11 pr-4 text-xs outline-none focus:ring-2 ring-blue-500/20 transition-all dark:text-white" 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredContacts.length > 0 ? filteredContacts.map((num, i) => (
                <div key={i} className="group p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-blue-600/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                      <Smartphone size={18} />
                    </div>
                    <span className="font-bold text-sm dark:text-zinc-200">{num}</span>
                  </div>
                  <button className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:gap-3">
                    Send Message <ArrowRight size={14} />
                  </button>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
                  <FileText size={64} className="mb-4" />
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px]">No Contacts Uploaded</p>
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
