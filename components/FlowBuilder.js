import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { db, auth } from '../firebase'; // पाथ ठीक किया
import { doc, setDoc } from 'firebase/firestore';
import { Save, PlusSquare, PlayCircle, Clock } from 'lucide-react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start: Hello! Welcome to BaseKey' }, type: 'input' },
];

const FlowBuilder = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const user = auth.currentUser;

  // 1. कनेक्शन लॉजिक (एक मैसेज को दूसरे से जोड़ना)
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // 2. नया मैसेज डिब्बा (Node) जोड़ना
  const addMessageNode = () => {
    const id = (nodes.length + 1).toString();
    const newNode = {
      id,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `New Message (Node ${id})` },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // 3. पूरा सेटअप Firebase में सेव करना
  const saveFlow = async () => {
    if (!user) return;
    try {
      const flowData = { nodes, edges, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, "users", user.uid, "flows", "welcome_bot"), flowData);
      alert("Flow Saved Successfully! 🚀");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-[#050505]">
      {/* Header Panel */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black">
        <div>
          <h2 className="text-xl font-black dark:text-white italic">Interactive Builder</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase">Design your WhatsApp logic</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addMessageNode} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold dark:text-white hover:bg-zinc-200 transition-all">
            <PlusSquare size={18} /> Add Node
          </button>
          <button onClick={saveFlow} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 active:scale-95">
            <Save size={18} /> Save Flow
          </button>
        </div>
      </div>

      {/* Drag & Drop Canvas */}
      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          fitView
          className="bg-zinc-50 dark:bg-[#050505]"
        >
          <Background color="#888" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Sidebar Tool (Properties) */}
      <div className="absolute right-6 top-24 w-64 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50">
        <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2"><Clock size={16} /> Delay Setup</h4>
        <p className="text-[10px] text-zinc-500 mb-4 font-bold uppercase tracking-widest">Wait time before next msg</p>
        <select className="w-full p-3 bg-zinc-100 dark:bg-black rounded-xl text-sm outline-none dark:text-white">
          <option>Instant (0s)</option>
          <option>3 Seconds</option>
          <option>10 Seconds</option>
          <option>1 Minute</option>
        </select>
      </div>
    </div>
  );
};

export default FlowBuilder;
            
