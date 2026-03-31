import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, 
  useNodesState, useEdgesState, useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Maximize } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"));
      if (snap.exists()) {
        setNodes(snap.data().flowData.nodes || []);
        setEdges(snap.data().flowData.edges || []);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // NEURAL SYNC: Ye function Canvas ko force-refresh karega
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          // Naya Object Reference banana zaroori hai refresh ke liye
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <FlowSidebar onAddNode={(type) => {
        const id = `node_${Date.now()}`;
        setNodes((nds) => nds.concat({ id, type, position: { x: 400, y: 300 }, data: { header: { type: 'text', text: 'WELCOME' }, body: 'Hello!', buttons: [] } }));
      }} /> 
      <div className="flex-1 relative">
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between pointer-events-none">
          <button onClick={() => fitView()} className="pointer-events-auto p-3 bg-white rounded-2xl shadow-xl"><Maximize size={20} /></button>
          <button onClick={async () => { setIsSaving(true); await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), { flowData: toObject() }, { merge: true }); setIsSaving(false); }} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl">
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Deploy Architecture
          </button>
        </div>
        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={(p) => setEdges((eds) => addEdge(p, eds))}
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setCenter(node.position.x + 250, node.position.y + 100, { zoom: 1.2, duration: 800 }); }}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes} fitView
        ><Background color="#E2E8F0" /><Controls /></ReactFlow>
      </div>
      {selectedNodeId && (
        <PropertiesPanel 
          key={selectedNodeId}
          selectedNode={nodes.find(n => n.id === selectedNodeId)} 
          onUpdate={updateNodeData} 
          onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNodeId(null); }}
          onClose={() => setSelectedNodeId(null)} 
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (<ReactFlowProvider><FlowBuilderContent /></ReactFlowProvider>);
export default FlowBuilder;
            
