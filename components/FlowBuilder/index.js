import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Maximize, Link2, Zap } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import ListNode from './ListNode'; 
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode, startNode: StartNode, listNode: ListNode };

const FlowBuilderContent = () => {
  const { setCenter, screenToFlowPosition, toObject, fitView } = useReactFlow(); 
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectSource, setConnectSource] = useState(null); // Connecting State
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"));
        if (snap.exists() && snap.data().flowData?.nodes) {
          setNodes(snap.data().flowData.nodes);
          setEdges(snap.data().flowData.edges || []);
        }
      } catch (e) { console.error(e); }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // REAL-TIME SYNC: Immutability fix for instant canvas update
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    }));
  }, [setNodes]);

  // SMART TAP-TO-CONNECT LOGIC
  const onNodeClick = useCallback((_, node) => {
    if (connectSource && connectSource !== node.id) {
      const newEdge = { 
        id: `e-${connectSource}-${node.id}`, 
        source: connectSource, 
        target: node.id,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 3 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setConnectSource(null); // Connection done
    } else {
      setSelectedNodeId(node.id);
      setCenter(node.position.x + 250, node.position.y + 100, { zoom: 1.2, duration: 800 });
    }
  }, [connectSource, setEdges, setCenter]);

  const addNewNode = useCallback((type) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id, type, 
      position: { x: 400, y: 300 }, 
      data: { header: { type: 'text', text: 'WELCOME' }, body: 'Neural message content...', buttons: [] }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <FlowSidebar onAddNode={addNewNode} /> 

      <div className="flex-1 relative">
        {/* Floating Connection Mode Banner */}
        {connectSource && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-3">
            <Link2 size={16}/> Tap destination node to link
          </div>
        )}

        <div className="absolute top-6 left-6 right-6 z-40 flex justify-between pointer-events-none">
          <button onClick={() => fitView({ padding: 0.3 })} className="pointer-events-auto p-3 bg-white rounded-2xl shadow-xl border border-slate-100 active:scale-90"><Maximize size={20} /></button>
          <button onClick={async () => { setIsSaving(true); await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), { flowData: toObject() }, { merge: true }); setIsSaving(false); }} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Deploy Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={(p) => setEdges((eds) => addEdge(p, eds))}
          onNodeClick={onNodeClick}
          onPaneClick={() => { setSelectedNodeId(null); setConnectSource(null); }}
          nodeTypes={nodeTypes} fitView
        >
          <Background variant="dots" gap={30} color="#E2E8F0" />
          <Controls />
        </ReactFlow>
      </div>
      
      {selectedNodeId && (
        <PropertiesPanel 
          key={selectedNodeId} 
          selectedNode={nodes.find(n => n.id === selectedNodeId)} 
          onUpdate={updateNodeData} 
          onStartConnect={() => setConnectSource(selectedNodeId)}
          onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNodeId(null); }} 
          onClose={() => setSelectedNodeId(null)} 
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (<ReactFlowProvider><FlowBuilderContent /></ReactFlowProvider>);
export default FlowBuilder;
