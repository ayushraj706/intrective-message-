import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Zap, ZapOff, Maximize } from 'lucide-react';

// Firebase Logic
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import ListNode from './ListNode'; 
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

// Node types registry
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
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);

  // 1. Load Flow: Firebase se data lana
  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const { flowData, isActive } = docSnap.data();
          if (flowData?.nodes?.length > 0) {
            setNodes(flowData.nodes);
            setEdges(flowData.edges || []);
          } else {
            setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: { title: 'START ROOT' } }]);
          }
          setIsBotActive(isActive || false);
        }
      } catch (e) { 
        console.error("Load Error:", e);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // 2. Add New Node Logic (Mobile Click + Desktop Drop compatible)
  const addNewNode = useCallback((type, position = null) => {
    const id = `node_${Date.now()}`;
    // Position agar null hai (Click case), toh random middle position set karo
    const spawnPos = position || { 
      x: Math.random() * 200 + 300, 
      y: Math.random() * 200 + 200 
    };
    
    // Neural Data Structure (Title, Media, Body, Buttons logic)
    const defaultData = type === 'listNode' ? {
      header: { type: 'text', text: 'MENU TITLE' },
      body: 'Select an option below:',
      footer: 'BaseKey Neural Menu',
      listButton: 'View Options',
      listRows: [{ id: `r_${Date.now()}`, title: 'Option 1', desc: 'Description' }]
    } : {
      header: { type: 'text', text: 'WELCOME' },
      body: 'Type your business message...',
      footer: '',
      buttons: []
    };

    const newNode = {
      id,
      type: type || 'whatsappNode',
      position: spawnPos,
      data: defaultData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // 3. Desktop Drag & Drop Handlers
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addNewNode(type, position);
  }, [screenToFlowPosition, addNewNode]);

  // 4. Node Click Logic (Zoom and Mismatch prevention)
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setCenter(node.position.x + 250, node.position.y + 100, { zoom: 1.2, duration: 800 }); 
  }, [setCenter]);

  // 5. Central Data Sync Logic
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        const updatedNode = { ...node, data: { ...node.data, ...newData } };
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
        return updatedNode;
      }
      return node;
    }));
  }, [selectedNode, setNodes]);

  const saveFlow = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData: toObject(),
        updatedAt: new Date().toISOString(),
        isActive: isBotActive
      }, { merge: true });
    } catch (e) { console.error("Save Error"); }
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar ko onAddNode bheja taaki Click par kaam kare */}
      <FlowSidebar onAddNode={addNewNode} /> 

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
             <button onClick={() => fitView({ padding: 0.3, duration: 800 })} className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-600 hover:text-indigo-600 transition-all">
               <Maximize size={20} />
             </button>
          </div>

          <button onClick={saveFlow} disabled={isSaving} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            Deploy Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes} 
          fitView 
        >
          <Background variant="dots" gap={30} size={1} color="#E2E8F0" />
          <Controls className="bg-white rounded-2xl border-none shadow-2xl overflow-hidden" />
          <MiniMap className="rounded-3xl border-4 border-white shadow-2xl overflow-hidden mb-6 mr-6" />
        </ReactFlow>
      </div>
      
      {/* KEY LOGIC: selectedNode.id as key ensures the panel resets correctly when switching nodes */}
      {selectedNode && (
        <PropertiesPanel 
          key={selectedNode.id} 
          selectedNode={selectedNode} 
          onUpdate={updateNodeData} 
          onDelete={(id) => { 
            setNodes(nds => nds.filter(n => n.id !== id)); 
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
            setSelectedNode(null); 
          }} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider><FlowBuilderContent /></ReactFlowProvider>
);

export default FlowBuilder;
