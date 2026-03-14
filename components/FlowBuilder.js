import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { db, auth } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore';
import { Save, PlusCircle, MessageCircle, MousePointer2 } from 'lucide-react';

// शुरुआती नोड (Start Point)
const initialNodes = [
  { id: 'node-1', type: 'input', data: { label: 'Start: Welcome Message' }, position: { x: 250, y: 5 } },
];

const FlowBuilder = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const user = auth.currentUser;

  // कनेक्शन लॉजिक
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // नया व्हाट्सएप मैसेज नोड जोड़ना
  const addNode = (type) => {
    const id = `node-${nodes.length + 1}`;
    const newNode = {
      id,
      data: { label: type === 'text' ? 'New Text Message' : 'WhatsApp Buttons (Max 3)' },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      style: { 
        background: type === 'text' ? '#2563eb' : '#16a34a', 
        color: '#fff', 
        borderRadius: '12px',
        padding: '10px',
        fontWeight: 'bold'
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Firebase में फ्लो सेव करना
  const onSave = async () => {
    if (!user) return;
    try {
      const flowData = { nodes, edges };
      await setDoc(doc(db, "users", user.uid, "flows", "main_flow"), flowData);
      alert("Flow Saved to Cloud! 🚀");
    } catch (err) {
      alert("Save Failed!");
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#050505]">
      {/* Toolbar */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black">
        <div className="flex gap-4">
          <button onClick={() => addNode('text')} className="flex items-center gap-2 bg-blue-600/10 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
            <MessageCircle size={16} /> Add Text
          </button>
          <button onClick={() => addNode('button')} className="flex items-center gap-2 bg-green-600/10 text-green-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all">
            <PlusCircle size={16} /> Add Buttons
          </button>
        </div>
        <button onClick={onSave} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-600/20 active:scale-95">
          <Save size={18} className="inline mr-2" /> Save Builder
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          fitView
        >
          <Background color="#aaa" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowBuilder;
