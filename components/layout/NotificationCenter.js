// components/layout/NotificationCenter.js ke andar dropdown wala part change karo
{show && (
  <div className="fixed top-5 right-5 w-80 bg-[#0f0f0f]/95 border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 z-[999] backdrop-blur-3xl animate-in slide-in-from-right-10 duration-300">
    <div className="flex justify-between items-center mb-6 px-2">
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        Neural Alerts
      </h4>
      <button onClick={() => setShow(false)} className="text-zinc-700 hover:text-white transition-colors">
        <X size={16}/>
      </button>
    </div>

    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {notifs.length === 0 ? (
        <div className="py-14 text-center opacity-20">
          <p className="text-[10px] font-black uppercase tracking-widest">Neural Link: Stable</p>
        </div>
      ) : (
        notifs.map(n => (
          <div 
            key={n.id} 
            className={`p-4 rounded-3xl border transition-all ${n.status === 'unread' ? 'bg-blue-600/5 border-blue-500/20' : 'bg-white/[0.02] border-white/5'}`}
          >
            <div className="flex gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                 {n.type === 'error' ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
              </div>
              <div>
                <p className="text-[11px] font-bold text-white leading-tight">{n.title}</p>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{translateError(n.message)}</p>
                <span className="inline-block mt-3 text-[8px] font-black uppercase tracking-tighter bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{n.platform}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
