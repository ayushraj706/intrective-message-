import React, { useState } from 'react';
import { Database, Zap, Plus, Globe, Link2, CheckCircle, XCircle } from 'lucide-react';

const VariableSettings = ({ userId, onClose }) => {
  const [variables, setVariables] = useState([
    { id: 1, name: 'user_balance', type: 'api', url: 'https://api.store.com/bal', status: 'connected' },
    { id: 2, name: 'support_link', type: 'static', value: 'https://ayush.fun', status: 'active' }
  ]);

  const [testLoading, setTestLoading] = useState(null);

  // Connection Test Logic
  const testConnection = async (id, url) => {
    setTestLoading(id);
    try {
      // Hum businessman ki API ko ping karenge
      const res = await axios.post('/api/test-connection', { url });
      if(res.data.success) {
        // Success: Green Connected Status
        alert("Neural Connection Successful!");
      }
    } catch (e) {
      alert("Connection Failed. Check URL.");
    }
    setTestLoading(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 italic uppercase italic">Neural <span className="text-indigo-600">Variables</span></h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><XCircle size={20}/></button>
      </div>

      <div className="space-y-4">
        {variables.map((v) => (
          <div key={v.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Type: {v.type}</span>
              <div className={`flex items-center gap-1 text-[9px] font-bold ${v.status === 'connected' ? 'text-green-500' : 'text-slate-400'}`}>
                {v.status === 'connected' ? <CheckCircle size={10}/> : <Zap size={10}/>} {v.status.toUpperCase()}
              </div>
            </div>
            
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none mb-2"
              value={v.name} placeholder="Variable Name (e.g. balance)"
            />
            
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-mono text-indigo-600 outline-none"
                value={v.url || v.value} placeholder="API URL or Static Value"
              />
              <button 
                onClick={() => testConnection(v.id, v.url)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-indigo-200 hover:scale-95 transition-all"
              >
                {testLoading === v.id ? 'TESTING...' : 'CONNECT'}
              </button>
            </div>
          </div>
        ))}

        <button className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-400 transition-all">
          <Plus size={16}/> ADD CUSTOM VARIABLE
        </button>
      </div>
    </div>
  );
};
                  
