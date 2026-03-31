import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, addEdge, Background, Controls, useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Maximize, MousePointer2, Link2 } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import ListNode from './ListNode'; 
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode, startNode: StartNode, listNode: ListNode };

const FlowBuilderContent = () => {
  const { setCenter, toObject, fitView } = useReactFlow(); 
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectSource, setConnectSource] = useState(null); // Connection start point
  const [isSaving, setIsSaving] = useState(false);

  // 1. CLICK TO CONNECT LOGIC (Mobile Special)
  const onNodeClick = useCallback((event, node) => {
    if (connectSource && connectSource !== node.id) {
      // Agar pehle se ek source select hai, toh connection bana do
      const newEdge = { 
        id: `e-${connectSource}-${node.id}`, 
        source: connectSource, 
        target: node.id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 3 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setConnectSource(null); // Reset karo
    } else {
      setSelectedNodeId(node.id);
      setCenter(node.position.x + 250, node.position.y + 100, { zoom: 1.2, duration: 800 });
    }
  }, [connectSource, setEdges, setCenter]);

  const addNewNode = (type) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id, type, 
      position: { x: window.innerWidth / 4, y: window.innerHeight / 4 }, 
      data: { header: { type: 'text', text: 'NEW' }, body: 'Tap to edit...', buttons: [] }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <FlowSidebar onAddNode={addNewNode} /> 
      <div className="flex-1 relative">
        {/* Connection Mode Indicator */}
        {connectSource && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-2">
            <Link2 size={14}/> Tap Destination Node to Connect
          </div>
        )}

        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between pointer-events-none">
          <button onClick={() => fitView()} className="pointer-events-auto p-3 bg-white rounded-2xl shadow-xl"><Maximize size={20} /></button>
          <button onClick={async () => { setIsSaving(true); await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), { flowData: toObject() }, { merge: true }); setIsSaving(false); }} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl">
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Deploy Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={(p) => setEdges((eds) => addEdge(p, eds))}
          onNodeClick={onNodeClick}
          onPaneClick={() => { setSelectedNodeId(null); setConnectSource(null); }}
          nodeTypes={nodeTypes} fitView
        ><Background color="#E2E8F0" /><Controls /></ReactFlow>
      </div>

      {selectedNodeId && (
        <PropertiesPanel 
          key={selectedNodeId}
          selectedNode={nodes.find(n => n.id === selectedNodeId)} 
          onUpdate={(id, data) => setNodes(nds => nds.map(n => n.id === id ? {...n, data} : n))} 
          onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNodeId(null); }}
          onClose={() => setSelectedNodeId(null)}
          // Extra prop: Connection start karne ke liye
          onStartConnect={() => setConnectSource(selectedNodeId)}
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (<ReactFlowProvider><FlowBuilderContent /></ReactFlowProvider>);
export default FlowBuilder;
              
