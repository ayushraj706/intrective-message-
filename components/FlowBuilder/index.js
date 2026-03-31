import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Maximize, Play, Sparkles } from 'lucide-react'; // Play icon added

// Firebase Logic
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import ListNode from './ListNode'; 
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import FlowSimulator from './FlowSimulator'; // Naya component import kiya

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Simulator State

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
          } else {
            setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: { title: 'START ROOT' } }]);
          }
        }
      } catch (e) { console.error(e); }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    }));
  }, [setNodes]);

  const addNewNode = useCallback((type, position = null) => {
    const id = `node_${Date.now()}`;
    const spawnPos = position || { x: 400, y: 200 };
    const defaultData = type === 'listNode' ? {
      header: { type: 'text', text: 'LIST TITLE' },
      body: 'Select an option:',
      footer: 'BaseKey List Menu',
      listButton: 'View Menu',
      listRows: [{ id: `r_${Date.now()}`, title: 'Option 1', desc: '' }]
    } : {
      header: { type: 'text', text: 'MESSAGE TITLE' },
      body: 'Type your message...',
      footer: '',
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
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData: toObject(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <FlowSidebar onAddNode={addNewNode} /> 

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
             <button onClick={() => fitView({ padding: 0.3, duration: 800 })} className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-600 hover:text-indigo-600 transition-all">
               <Maximize size={20} />
             </button>
             
             {/* NEW PLAY BUTTON */}
             <button 
               onClick={() => setIsPreviewOpen(true)}
               className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
             >
               <Play size={14} fill="white" /> Run Simulator
             </button>
          </div>

          <button onClick={saveFlow} disabled={isSaving} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Deploy Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 3 } }, eds))}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setCenter(node.position.x + 250, node.position.y + 100, { zoom: 1.2, duration: 800 });
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes} 
          fitView 
        >
          <Background variant="dots" gap={30} size={1} color="#E2E8F0" />
          <Controls className="bg-white rounded-xl border-none shadow-xl" />
        </ReactFlow>
      </div>
      
      {selectedNodeId && (
        <PropertiesPanel 
          key={selectedNodeId} 
          selectedNode={nodes.find(n => n.id === selectedNodeId)} 
          onUpdate={updateNodeData} 
          onDelete={(id) => { 
            setNodes(nds => nds.filter(n => n.id !== id)); 
            setSelectedNodeId(null); 
          }} 
          onClose={() => setSelectedNodeId(null)} 
        />
      )}

      {/* RENDER SIMULATOR MODAL */}
      {isPreviewOpen && (
        <FlowSimulator 
          nodes={nodes} 
          edges={edges} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (<ReactFlowProvider><FlowBuilderContent /></ReactFlowProvider>);
export default FlowBuilder;
            
