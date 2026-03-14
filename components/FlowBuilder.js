import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Handle, 
  Position, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageSquare, MousePointer2, Save, Plus, Trash2, Smartphone } from 'lucide-react';

// --- 1. Custom Node: व्हाट्सएप टेक्स्ट मैसेज (Tile Style) ---
const WhatsAppTextNode = ({ data }) => (
  <div className="bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-2xl shadow-2xl w-64 overflow-hidden animate-in zoom-in-95 duration-300">
    <div className="bg-blue-500 p-2 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
      <MessageSquare size={12} /> Text Message
    </div>
    <div className="p-4">
      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold mb-1 uppercase">Message Body</p>
      <div className="bg-zinc-100 dark:bg-black p-3 rounded-xl text-xs dark:text-white italic border border-zinc-200 dark:border-zinc-800">
        {data.label}
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
  </div>
);

// --- 2. Custom Node: व्हाट्सएप बटन मैसेज (Tile Style) ---
const WhatsAppButtonNode = ({ data }) => (
  <div className="bg-white dark:bg-zinc-900 border-2 border-green-500 rounded-2xl shadow-2xl w-64 overflow-hidden animate-in zoom-in-95 duration-300">
    <div className="bg-green-500 p-2 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
      <Plus size={12} /> Button Group
    </div>
    <div className="p-4 space-y-3">
      <div className="bg-zinc-100 dark:bg-black p-2 rounded-lg text-[10px] dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
        Question: {data.label}
      </div>
      {/* व्हाट्सएप के 3 बटन्स का प्रीव्यू */}
      <div className="space-y-2">
        <div className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg text-[10px] font-bold text-center">Button 1</div>
        <div className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg text-[10px] font-bold text-center">Button 2</div>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500 border-2 border-white" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-white" />
  </div>
);

const nodeTypes = {
  whatsappText: WhatsAppTextNode,
  whatsappButtons: WhatsAppButtonNode,
};

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // नया ब्लॉक जोड़ने का फंक्शन
  const addBlock = (type) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type,
      data: { label: type === 'whatsappText' ? 'Type your message here...' : 'Choose an option?' },
      position: { x: 250, y: 150 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-[#050505] overflow-hidden">
      {/* Left Sidebar: Blocks Menu (As seen in TileDesk) */}
      <div className="w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 z-50">
        <div>
          <h2 className="text-xl font-black dark:text-white italic tracking-tighter">Design Studio</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Drag and build flows</p>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Message Blocks</p>
          <button onClick={() => addBlock('whatsappText')} className="w-full flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-500 hover:text-white rounded-2xl transition-all group border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-500"><MessageSquare size={16}/></div>
            <span className="text-xs font-bold uppercase">Text Message</span>
          </button>

          <button onClick={() => addBlock('whatsappButtons')} className="w-full flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-green-500 hover:text-white rounded-2xl transition-all group border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white group-hover:bg-white group-hover:text-green-500"><Plus size={16}/></div>
            <span className="text-xs font-bold uppercase">Button Group</span>
          </button>
        </div>

        <div className="mt-auto">
          <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <Save size={16} /> Save Builder
          </button>
        </div>
      </div>

      {/* Main Builder Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant="dots" gap={20} size={1} color="#333" />
          <Controls className="bg-white dark:bg-zinc-900 border-none shadow-2xl" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowBuilder;
  
