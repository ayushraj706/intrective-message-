import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, TrendingUp, MessageSquare, Zap, 
  ArrowUpRight, ArrowDownRight, Globe, Cpu, 
  Layers, BarChart3, Clock, Bell
} from 'lucide-react';

// --- FAKE DATA FOR TRADING STYLE GRAPH ---
const graphData = [30, 45, 35, 60, 55, 80, 75, 90, 85, 100, 95, 110];

const MainDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');

  // Stats Data
  const stats = [
    { label: 'Total Neural Traffic', value: '854.2k', change: '+12.5%', icon: <Activity size={20}/>, up: true },
    { label: 'Active Neural Links', value: '1,204', change: '+5.2%', icon: <Zap size={20}/>, up: true },
    { label: 'Success Rate', value: '99.9%', change: '-0.1%', icon: <TrendingUp size={20}/>, up: false },
    { label: 'Response Latency', value: '42ms', change: '-8ms', icon: <Clock size={20}/>, up: true },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-sans selection:bg-blue-500/30">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic">Neural Engine Live</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Command <span className="text-blue-600">Center</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {['24h', '7d', '30d'].map((range) => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-white'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 2. NEURAL STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 hover:border-blue-500/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                {stat.icon}
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h2 className="text-3xl font-black italic tracking-tighter mb-2">{stat.value}</h2>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stat.up ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
              {stat.change} <span className="text-zinc-600 ml-1 italic font-medium">vs last period</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. MAIN TRADING CHART AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* BIG GRAPH CARD */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/> Neural Traffic Flow
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">Real-time data packets across all nodes</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-blue-500 tracking-tighter">128.4 Gbps</p>
                    <p className="text-[10px] text-emerald-500 font-black uppercase">System Nominal</p>
                </div>
            </div>

            {/* CUSTOM SVG TRADING GRAPH */}
            <div className="h-64 w-full relative mt-10">
                <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <motion.path 
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        d={`M 0 200 ${graphData.map((d, i) => `L ${(i * 1000) / (graphData.length - 1)} ${200 - d}`).join(' ')} L 1000 200 Z`}
                        fill="url(#gradient)"
                    />
                    {/* Line stroke */}
                    <motion.path 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                        d={`M 0 ${200 - graphData[0]} ${graphData.map((d, i) => `L ${(i * 1000) / (graphData.length - 1)} ${200 - d}`).join(' ')}`}
                        fill="none" stroke="#3b82f6" strokeWidth="3"
                    />
                </svg>
                {/* Overlay Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-white" />)}
                </div>
            </div>
        </div>

        {/* DISTRIBUTION CARD */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Layers size={18} className="text-purple-500"/> Node Distribution
            </h3>
            <div className="space-y-6">
                {[
                    { name: 'WhatsApp Business', val: 65, color: 'bg-emerald-500' },
                    { name: 'Telegram Neural Client', val: 45, color: 'bg-blue-500' },
                    { name: 'Instagram Creator', val: 30, color: 'bg-pink-500' },
                    { name: 'Facebook Messenger', val: 20, color: 'bg-indigo-500' },
                ].map(node => (
                    <div key={node.name} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>{node.name}</span>
                            <span className="text-zinc-400">{node.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${node.val}%` }}
                                className={`h-full ${node.color} shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 4. RECENT NEURAL LOGS */}
      <div className="bg-zinc-900/10 border border-white/5 rounded-[2.5rem] p-8">
         <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-zinc-400"/>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Live Neural Logs</h3>
         </div>
         <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5 group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <MessageSquare size={18}/>
                     </div>
                     <div>
                        <p className="text-xs font-bold">Neural Link Established: <span className="text-blue-500">Node_#4592</span></p>
                        <p className="text-[10px] text-zinc-500 font-medium italic">Handshake completed in 12ms</p>
                     </div>
                  </div>
                  <span className="text-[9px] font-black text-zinc-600 uppercase">2 mins ago</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default MainDashboard;
        
