import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, 
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

const nodeTypes = { 
  whatsappNode: WhatsAppNode, 
  startNode: StartNode,
  listNode: ListNode 
};

const FlowBuilderContent = () => {
  const reactFlowWrapper = useRef(null);
  const { setCenter, screenToFlowPosition, toObject, fitView } = useReactFlow(); 
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { flowData } = docSnap.data();
          if (flowData?.nodes?.length > 0) {
            setNodes(flowData.nodes);
            setEdges(flowData.edges || []);
          }
        }
      } catch (e) { console.error(e); }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // LIVE UPDATE FUNCTION: Canvas ko refresh karne wala jadoo
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addNewNode = useCallback((type, position = null) => {
    const id = `node_${Date.now()}`;
    const spawnPos = position || { x: 400, y: 300 };
    const defaultData = type === 'listNode' ? {
      header: { type: 'text', text: 'LIST TITLE' },
      body: 'Select an option:',
      listButton: 'View Menu',
      listRows: [{ id: `r_${Date.now()}`, title: 'Option 1', desc: '' }]
    } : {
      header: { type: 'text', text: 'MESSAGE TITLE' },
      body: 'Type your message...',
      buttons: []
    };
    const newNode = { id, type: type || 'whatsappNode', position: spawnPos, data: defaultData };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNewNode(type, position);
  }, [screenToFlowPosition, addNewNode]);

  const saveFlow = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), { flowData: toObject() }, { merge: true });
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <FlowSidebar onAddNode={addNewNode} /> 
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between pointer-events-none">
          <button onClick={() => fitView({ padding: 0.3, duration: 800 })} className="pointer-events-auto p-3 bg-white rounded-2xl shadow-xl border border-slate-100"><Maximize size={20} /></button>
          <button onClick={saveFlow} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl">
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Deploy Architecture
          </button>
        </div>
        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={(p) => setEdges((eds) => addEdge(p, eds))}
          onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
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
                       
